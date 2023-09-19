import { TextDocument, TextDocumentContentChangeEvent, RemoteConsole, Position, Range, Diagnostic } from 'vscode-languageserver';
import * as vscode from 'vscode-languageserver';
import { CancellationToken } from 'vscode-jsonrpc';
import * as thmProto from '@lib/protocol';
import * as coqProto from './coqtop/coq-proto';
import * as coqParser from './parsing/coq-parser';
import * as textUtil from '@lib/text-util';
import { AnnotatedText, textToDisplayString } from './util/AnnotatedText';
import { CoqStateMachine, GoalResult, StateStatus } from './stm/STM';
import { FeedbackSync, DocumentFeedbackCallbacks } from './FeedbackSync';
import { SentenceCollection } from './sentence-model/SentenceCollection';
import { CoqProject } from './CoqProject';
import { CommandResult } from '@lib/protocol';

/** vscode needs to export this class */
export interface TextDocumentItem {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

export interface MessageCallback {
  sendMessage(level: string, message: AnnotatedText, routeId: coqProto.RouteId): void;
}
export interface ResetCallback {
  sendReset(): void;
}
export interface LtacProfCallback {
  sendLtacProfResults(results: coqProto.LtacProfResults): void;
}

export interface CoqtopStartCallback {
  sendCoqtopStart(): void;
}

export interface CoqtopStopCallback {
  sendCoqtopStop(reason: thmProto.CoqtopStopReason, message?: string): void;
}

export type DocumentCallbacks = MessageCallback & ResetCallback & LtacProfCallback & CoqtopStartCallback & CoqtopStopCallback & DocumentFeedbackCallbacks;

export class CoqDocument implements TextDocument {
  // TextDocument
  public get uri() { return this.document.uri };
  public get languageId() { return this.document.languageId };
  public get version() { return this.document.version };
  public get lineCount() { return this.document.lineCount };
  public getText() {
    return this.document.getText();;
  }

  private project: CoqProject;

  private stm: CoqStateMachine | null = null;
  private clientConsole: RemoteConsole;
  private callbacks: MessageCallback & ResetCallback & LtacProfCallback & CoqtopStartCallback & CoqtopStopCallback;
  private document: SentenceCollection = null;
  // Feedback destined for the extension client/view
  private feedback: FeedbackSync;

  private parsingRanges: Range[] = [];
  // private interactionCommands = new AsyncWorkQueue();
  // private interactionLoopStatus = InteractionLoopStatus.Idle;
  // we'll use this as a callback, so protect it with an arrow function so it gets the correct "this" pointer

  constructor(project: CoqProject, document: TextDocumentItem, clientConsole: RemoteConsole, callbacks: DocumentCallbacks) {
    this.clientConsole = clientConsole;
    this.document = new SentenceCollection(document);
    this.callbacks = callbacks;
    this.project = project;
    this.feedback = new FeedbackSync(callbacks, 200);

    if (project.settings.coqtop.startOn === "open-script")
      this.resetCoq();
  }

  public async applyTextEdits(changes: TextDocumentContentChangeEvent[], newVersion: number) {
    // sort the edits such that later edits are processed first
    const sortedChanges =
      changes.slice().sort((change1, change2) =>
        textUtil.positionIsAfter(
          textUtil.getChangeEventRange(change1).start,
          textUtil.getChangeEventRange(change2).start) ? -1 : 1)

    this.document.applyTextChanges(newVersion, changes);

    if (this.isStmRunning()) {
      try {
        this.stm.applyChanges(sortedChanges, newVersion, this.document.getText());
      } catch (err) {
        this.clientConsole.error("STM crashed while applying text edit: " + err.toString())
      }

      this.updateHighlights();
      this.updateDiagnostics();
    }

    if (this.isStmRunning() && this.project.settings.coq.diagnostics && this.project.settings.coq.diagnostics.checkTextSynchronization) {
      const documentText = this.document.getText();
      const parsedSentencesText = this.document.getSentenceText();
      await this.stm.flushEdits();
      const stmText = this.stm.getStatesText();
      if (!documentText.startsWith(parsedSentencesText) && this.document.getDocumentVersion() === newVersion) {
        console.error("Document text differs from parsed-sentences text");
        console.error("On applied changes: ");
        changes.forEach(change => {
          console.error("  > " + textUtil.rangeToString(textUtil.getChangeEventRange(change)) + " -> " + change.text);
        })
      }
      if (!documentText.startsWith(stmText) && this.stm.getDocumentVersion() === newVersion) {
        console.error("Document text differs from STM text");
        console.error("On applied changes: ");
        changes.forEach(change => {
          console.error("  > " + textUtil.rangeToString(textUtil.getChangeEventRange(change)) + " -> " + change.text);
        })
      }
    }
  }

  public getCoqVersion() {
    return this.stm.getCoqVersion();
  }

  public getSentences(): SentenceCollection {
    return this.document;
  }

  public getSentencePrefixTextAt(pos: Position) {
    return this.document.getSentencePrefixTextAt(pos);
  }

  public offsetAt(pos: Position): number {
    return this.document.offsetAt(pos);
  }

  /**
   * @returns the Position (line, column) for the location (character position)
   */
  public positionAt(offset: number): Position {
    return this.document.positionAt(offset);
  }

  private sentenceToHighlightType(status: StateStatus): thmProto.HighlightType {
    switch (status) {
      case StateStatus.Axiom: return thmProto.HighlightType.Axiom;
      case StateStatus.Error: return thmProto.HighlightType.StateError;
      case StateStatus.Parsing: return thmProto.HighlightType.Parsing;
      case StateStatus.Processing: return thmProto.HighlightType.Processing;
      case StateStatus.Incomplete: return thmProto.HighlightType.Incomplete;
      case StateStatus.Processed: return thmProto.HighlightType.Processed;
    }
  }

  /** creates the current highlights from scratch */
  private createHighlights(): thmProto.Highlights {
    const highlights: thmProto.Highlights =
      { ranges: [[], [], [], [], [], []] };
    if (!this.isStmRunning())
      return highlights;
    for (const sent of this.stm.getSentences()) {
      const ranges = highlights.ranges[this.sentenceToHighlightType(sent.status)];
      if (ranges.length > 0 && textUtil.positionIsEqual(ranges[ranges.length - 1].end, sent.range.start))
        ranges[ranges.length - 1].end = sent.range.end;
      else {
        ranges.push(Range.create(sent.range.start, sent.range.end));
      }
    }
    return highlights;
  }

  private onCoqStateStatusUpdate(range: Range, status: StateStatus) {
    this.updateHighlights();
  }

  private onClearSentence(range: Range) {
    // this.updateHighlights();
  }

  private updateHighlights(now = false) {
    this.feedback.updateHighlights(() => {
      const highlights = this.createHighlights();
      const parsingRanges = highlights.ranges[thmProto.HighlightType.Parsing];
      Array.prototype.push.apply(parsingRanges, this.parsingRanges);
      return highlights;
    }, now);
  }

  private onCoqStateError(sentenceRange: Range, errorRange: Range, message: AnnotatedText) {
    this.updateHighlights();
    this.updateDiagnostics()
  }

  private onCoqMessage(level: coqProto.MessageLevel, message: AnnotatedText, routeId: coqProto.RouteId) {
    this.callbacks.sendMessage(coqProto.MessageLevel[level], message, routeId);
  }

  private onCoqStateLtacProf(range: Range, results: coqProto.LtacProfResults) {
    this.callbacks.sendLtacProfResults(results);
  }

  private async onCoqDied(reason: thmProto.CoqtopStopReason, error?: string) {
    this.callbacks.sendCoqtopStop(reason, error);
    if (error) {
      this.resetCoq();
      this.callbacks.sendReset();
    }
  }

  public async resetCoq() {
    if (this.isStmRunning())
      this.stm.shutdown(); // Don't bother awaiting
    this.stm = new CoqStateMachine(
      this.project,
      () => {
        this.callbacks.sendCoqtopStart();
        return this.project.createCoqTopInstance(this.uri);
      }, {
      sentenceStatusUpdate: (x1, x2) => this.onCoqStateStatusUpdate(x1, x2),
      clearSentence: (x1) => this.onClearSentence(x1),
      updateStmFocus: (x1) => this.onUpdateStmFocus(x1),
      error: (x1, x2, x3) => this.onCoqStateError(x1, x2, x3),
      message: (x1, x2, x3) => this.onCoqMessage(x1, x2, x3),
      ltacProfResults: (x1, x2) => this.onCoqStateLtacProf(x1, x2),
      coqDied: (reason: thmProto.CoqtopStopReason, error?: string) => this.onCoqDied(reason, error),
    });
  }

  private onUpdateStmFocus(focus: Position) {
    this.feedback.updateFocus(focus, false);
  }

  /** generates a list of contiguous commands
   * @param begin: where to start parsing commands
   * @param endOffset: if specified, stop at the last command to not exceed the offset
   */
  private *commandSequenceGenerator(begin: Position, end?: Position, highlight: boolean = false): IterableIterator<{ text: string, range: Range }> {
    const documentText = this.document.getText();
    let endOffset: number;
    if (end === undefined)
      endOffset = documentText.length;
    else
      endOffset = Math.min(this.offsetAt(end), documentText.length);

    let currentOffset = this.offsetAt(begin);
    if (currentOffset >= endOffset)
      return;

    while (true) {
      const commandLength = coqParser.parseSentenceLength(documentText.substr(currentOffset, endOffset))
      const nextOffset = currentOffset + commandLength;
      if (commandLength > 0 || nextOffset > endOffset) {
        const result =
        {
          text: documentText.substring(currentOffset, nextOffset)
          , range: Range.create(this.positionAt(currentOffset), this.positionAt(nextOffset))
        };
        yield result;
        // only highlight if the command was accepted (i.e. another is going to be request; i.e. after yield)
        if (highlight) {// Preliminary "parsing" highlight
          this.parsingRanges.push(result.range);

          this.updateHighlights(true);
        }
      } else
        return;
      currentOffset = nextOffset;
    }
  }

  private commandSequence(highlight = false) {
    return (begin: Position, end?: Position) => this.commandSequenceGenerator(begin, end, highlight);
  }

  public async dispose() {
    if (this.isStmRunning()) {
      await this.stm.shutdown();
      this.stm = null;
    }
  }

  /** Make sure that the STM is running */
  private assertStm() {
    if (!this.isStmRunning())
      this.resetCoq();
  }

  private toGoal(goal: GoalResult): CommandResult {
    if (goal.type === 'not-running')
      return goal;
    else if (!this.isStmRunning())
      return { type: 'not-running', reason: 'not-started' };
    // This is silly (Typescript is not yet smart enough)
    return { focus: this.stm.getFocusedPosition(), ...goal };
  }

  private updateDiagnostics(now = false) {
    if (!this.isStmRunning())
      return;

    this.feedback.updateDiagnostics(() => {
      const diagnostics: Diagnostic[] = [];
      for (const d of this.stm.getDiagnostics()) {
        let range: Range = d.sentence;
        if (d.range) {
          range = d.range;
        }
        diagnostics.push(Diagnostic.create(range, textToDisplayString(d.message), d.severity, undefined, 'coqtop'))
      }

      diagnostics.push(...Array.from(this.document.getErrors()));
      return diagnostics;
    }, now);
  }

  public async stepForward(token: CancellationToken): Promise<CommandResult> {
    this.assertStm();
    try {
      this.parsingRanges = [];
      const error = await this.stm.stepForward(this.commandSequence(true));
      if (error)
        return error
      return this.toGoal(await this.stm.getGoal());
    } finally {
      this.parsingRanges = [];
      this.updateHighlights(true);
      this.updateDiagnostics(true);
    }
  }

  public async stepBackward(token: CancellationToken): Promise<CommandResult> {
    this.assertStm();
    try {
      const error = await this.stm.stepBackward();
      if (error)
        return error;
      return this.toGoal(await this.stm.getGoal());
    } finally {
      this.updateHighlights(true);
      this.updateDiagnostics(true);
    }
  }

  public async interpretToPoint(location: number | vscode.Position, synchronous = false, token: CancellationToken): Promise<CommandResult> {
    this.assertStm();
    try {
      const pos = (typeof location === 'number') ? this.positionAt(location) : location;

      this.parsingRanges = [Range.create(this.stm.getFocusedPosition(), pos)];
      this.updateHighlights(true);
      const error = await this.stm.interpretToPoint(pos, this.commandSequence(false), this.project.settings.coq.interpretToEndOfSentence, synchronous, token);
      if (error)
        return error;
      return this.toGoal(await this.stm.getGoal());
    } finally {
      this.parsingRanges = [];
      this.updateHighlights(true);
      this.updateDiagnostics(true);
    }

  }

  public async interpretToEnd(synchronous = false, token: CancellationToken): Promise<CommandResult> {
    return await this.interpretToPoint(this.document.getText().length, synchronous, token);
  }

  public async getGoal(): Promise<CommandResult> {
    if (!this.isStmRunning())
      return { type: 'not-running', reason: "not-started" };
    try {
      return this.toGoal(await this.stm.getGoal());
    } finally {
      this.updateDiagnostics(true);
    }
  }

  public async getCachedGoal(pos: vscode.Position, direction: "preceding" | "subsequent"): Promise<CommandResult> {
    if (!this.isStmRunning())
      return { type: 'not-running', reason: "not-started" };
    try {
      return this.toGoal(await this.stm.getCachedGoal(pos, direction));
    } finally {
      this.updateDiagnostics(true);
    }
  }

  public async getStatus(force: boolean): Promise<CommandResult> {
    if (!this.isStmRunning())
      return { type: 'not-running', reason: "not-started" };
    try {
      return await this.stm.getStatus(force);
    } finally {
      this.updateDiagnostics(true);
    }
  }

  public async finishComputations() {
    if (this.isStmRunning())
      this.stm.finishComputations();
  }

  public async query(query: "locate" | "check" | "print" | "search" | "about" | "searchAbout", term: string, routeId: coqProto.RouteId) {
    if (!this.isStmRunning())
      return "Coq is not running";
    switch (query) {
      case "locate":
        try {
          return await this.stm.doQuery(`Locate ${term}.`, routeId);
        } catch (err) {
          return await this.stm.doQuery(`Locate "${term}".`, routeId);
        }
      case "check": return await this.stm.doQuery(`Check ${term}.`, routeId)
      case "print": return await this.stm.doQuery(`Print ${term}.`, routeId)
      case "search": return await this.stm.doQuery(`Search ${term}.`, routeId)
      case "about": return await this.stm.doQuery(`About ${term}.`, routeId)
      case "searchAbout": return await this.stm.doQuery(`SearchAbout ${term}.`, routeId)
    }
  }

  public async setWrappingWidth(columns: number) {
    if (!this.isStmRunning())
      return;

    await this.stm.setWrappingWidth(columns);
  }

  public async requestLtacProfResults(offset?: number) {
    if (!this.isStmRunning())
      return;
    await this.stm.requestLtacProfResults(offset ? this.positionAt(offset) : undefined);
  }

  public async interrupt() {
    if (!this.isStmRunning())
      return;
    this.stm.interrupt();
  }

  public async quitCoq() {
    if (!this.isStmRunning())
      return;
    await this.stm.shutdown();
    this.stm.dispose();
    this.stm = null;
  }

  public async setDisplayOptions(options: { item: thmProto.DisplayOption, value: thmProto.SetDisplayOption }[]) {
    if (!this.isStmRunning())
      return;
    this.stm.setDisplayOptions(options);
  }

  public isStmRunning(): boolean {
    return this.stm && this.stm.isRunning();
  }

  public hasFocusedGoal(): boolean {
    if (!this.isStmRunning)
      return false;

    return this.stm.hasFocusedGoal();
  }

}
