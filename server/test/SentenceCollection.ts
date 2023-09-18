// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as vscode from 'vscode-languageserver';

import { SentenceCollection } from '../src/sentence-model/SentenceCollection';
import { TextDocumentItem } from '../src/document'

interface SentenceCollection_PRIVATE {
  applyChangesToDocumentText(changes: vscode.TextDocumentContentChangeEvent[]): void;
}

function getText(text: string, range?: vscode.Range): string {
  const lines = text.split(/\r\n|\n\r|\n/);
  const newLines = text.split(/[^\r\n]+/);
  newLines.shift();
  const lineAt = (l: number) => lines[l] + newLines[l];

  if (range.start.line === range.end.line)
    return lineAt(range.start.line).substring(range.start.character, range.end.character);
  else
    return lineAt(range.start.line).substring(range.start.character) +
      lines.slice(range.start.line + 1, range.end.line).map((l, idx) => l + newLines[idx + range.start.line + 1]).join('') +
      lineAt(range.end.line).substring(0, range.end.character);
}

describe("SentenceCollection", function () {
  function newDoc(text: string | string[]): TextDocumentItem {
    if (text instanceof Array)
      text = text.join('\n');
    return {
      uri: "file:///doc",
      languageId: "coq",
      text: text,
      version: 0
    };
  }

  function makeChange(docText: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number, text: string): vscode.TextDocumentContentChangeEvent {
    const range = vscode.Range.create(startLine, startCharacter, endLine, endCharacter);
    return {
      range: range,
      text: text,
      rangeLength: getText(docText, range).length,
    }
  }

  describe('applyChangesToDocumentText', function () {
    it('1', function () {
      const doc = newDoc("Goal True.\npose True.\n");
      let sc = new SentenceCollection(doc);
      assert.equal(sc.getText(), "Goal True.\npose True.\n");
      (sc as any as SentenceCollection_PRIVATE).applyChangesToDocumentText([makeChange("Goal True.\npose True.\n", 0, 10, 1, 10, ""), makeChange("Goal True.\n", 0, 0, 0, 0, "pose True.\n")])
      assert.equal(sc.getText(), "pose True.\nGoal True.\n");
    })
  })

  describe('swap lines', function () {
    let doc: TextDocumentItem;
    let sc: SentenceCollection;
    beforeEach(function () {
      doc = newDoc("Goal True.\npose True.\n");
      sc = new SentenceCollection(doc);
      assert.equal(sc.getText(), "Goal True.\npose True.\n");
      assert.deepStrictEqual(sc.getSentences().map(s => s.getText()), ["Goal True.", "\npose True."]);
    })

    it('down - two transactions', function () {
      sc.applyTextChanges(1 + doc.version, [makeChange("Goal True.\npose True.\n", 0, 10, 1, 10, "")])
      assert.equal(sc.getText(), "Goal True.\n");
      assert.deepStrictEqual(sc.getSentences().map(s => s.getText()), ["Goal True."]);
      sc.applyTextChanges(2 + doc.version, [makeChange("Goal True.\n", 0, 0, 0, 0, "pose True.\n")])
      assert.equal(sc.getText(), "pose True.\nGoal True.\n");
      assert.deepStrictEqual(sc.getSentences().map(s => s.getText()), ["pose True.", "\nGoal True."]);
    })

    it('down - one transaction', function () {
      const changes = [
        makeChange("Goal True.\npose True.\n", 0, 10, 1, 10, ""),
        makeChange("Goal True.\n", 0, 0, 0, 0, "pose True.\n"),
      ]; 5
      sc.applyTextChanges(1 + doc.version, changes)
      assert.equal(sc.getText(), "pose True.\nGoal True.\n");
      assert.deepStrictEqual(sc.getSentences().map(s => s.getText()), ["pose True.", "\nGoal True."]);
    })

    it('up - two transactions', function () {
      sc.applyTextChanges(1 + doc.version, [makeChange("Goal True.\npose True.\n", 1, 10, 1, 10, "\nGoal True.")])
      assert.equal(sc.getText(), "Goal True.\npose True.\nGoal True.\n");
      assert.deepStrictEqual(sc.getSentences().map(s => s.getText()), ["Goal True.", "\npose True.", "\nGoal True."]);
      sc.applyTextChanges(2 + doc.version, [makeChange("Goal True.\n", 0, 0, 1, 0, "")])
      assert.equal(sc.getText(), "pose True.\nGoal True.\n");
      assert.deepStrictEqual(sc.getSentences().map(s => s.getText()), ["pose True.", "\nGoal True."]);
    })
  })
});
