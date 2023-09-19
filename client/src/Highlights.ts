import * as vscode from 'vscode';
import * as proto from '@lib/protocol';
import { decorations } from './Decorations';
import { TextEditor } from 'vscode';

function toRange(range: { start: { line: number, character: number }, end: { line: number, character: number } }) {
  return new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
}

export class Highlights {
  private current: { ranges: [vscode.Range[], vscode.Range[], vscode.Range[], vscode.Range[], vscode.Range[], vscode.Range[]] }
    = { ranges: [[], [], [], [], [], []] };

  constructor() {

  }

  public set(editors: Iterable<TextEditor>, highlights: proto.Highlights) {
    this.current = {
      ranges:
        [highlights.ranges[0].map(toRange)
          , highlights.ranges[1].map(toRange)
          , highlights.ranges[2].map(toRange)
          , highlights.ranges[3].map(toRange)
          , highlights.ranges[4].map(toRange)
          , highlights.ranges[5].map(toRange)
        ]
    };
    this.applyCurrent(editors);
  }

  public clearAll(editors: Iterable<TextEditor>) {
    this.current = { ranges: [[], [], [], [], [], []] };
    this.applyCurrent(editors);
  }

  public refresh(editors: Iterable<TextEditor>) {
    this.applyCurrent(editors);
  }

  private applyCurrent(editors: Iterable<TextEditor>) {
    for (const editor of editors) {
      editor.setDecorations(decorations.stateError, this.current.ranges[proto.HighlightType.StateError]);
      editor.setDecorations(decorations.parsing, this.current.ranges[proto.HighlightType.Parsing]);
      editor.setDecorations(decorations.processing, this.current.ranges[proto.HighlightType.Processing]);
      editor.setDecorations(decorations.incomplete, this.current.ranges[proto.HighlightType.Incomplete]);
      editor.setDecorations(decorations.axiom, this.current.ranges[proto.HighlightType.Axiom]);
      editor.setDecorations(decorations.processed, this.current.ranges[proto.HighlightType.Processed]);
    }
  }
}
