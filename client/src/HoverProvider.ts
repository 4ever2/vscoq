import * as vscode from 'vscode';
import { CoqProject } from './CoqProject';
import * as editorAssist from './EditorAssist';

// Inputs to ignore when calling hover
const excludes = [''];

function operatorRegex(str: string) {
  // Matching operators is simple, as Coq will kindly
  // print spaces before and after them,
  // we use lookahead/lookbehind to avoid catching them
  return new RegExp("(?<=\\s)" + str + "(?=\\s)", "g");
}

// Format a Coq type to be pretty and compact (e.g. replace forall with ∀)
function compactify(str: string) {
  const replaces = [
    { match: /\bfun\b/g, subst: "λ" },
    { match: /\bforall\b/g, subst: "∀" },
    { match: /\bexists\b/g, subst: "∃" },
    { match: operatorRegex("\\\\\\/"), subst: "∨" },
    { match: operatorRegex("\\/\\\\"), subst: "∧" },
    { match: operatorRegex("<->"), subst: "↔" },
    { match: operatorRegex("->"), subst: "→" },
    { match: operatorRegex("<="), subst: "≤" },
    { match: operatorRegex(">="), subst: "≥" },
    { match: operatorRegex("=>"), subst: "⇒" },
    { match: operatorRegex("<>"), subst: "≠" },
    { match: operatorRegex("~"), subst: "¬" }
  ];
  for (const replace of replaces) {
    str = str.replace(replace.match, replace.subst);
  }
  return str.trim();
}

// Quickly build a vscode.MarkdownString with a simple code block
function md_code_block(language: string, value: string) {
  const md = new vscode.MarkdownString();
  md.appendCodeblock(value, language);
  return md;
}

function formatCheck(response: string) {
  // response is the string printed by "Check identifier." :
  // |a
  // |\t : Type
  // |       type (continued if long) (7 space indent)
  // |where
  // |?optional = whatever

  // § Strip output of anything but the type
  const array = response.split("\nwhere\n");
  let type = array[0];
  type = type.replace(/^.*?\n\t : /, ""); // remove identifier
  type = type.replace(/^ {7}/gm, ""); // remove indent

  if (type === "") return;
  type = compactify(type);

  const hover = [md_code_block("coq", type)];
  return new vscode.Hover(hover);
}

function findClosingParenthese(str: string, start: number) {
  let depth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === "(") depth++;
    if (str[i] === ")") depth--;
    if (depth < 0) return i;
  }
  return null;
}

function formatLocate(response: string) {
  // Response is the string printed by "Locate "notation"."
  // On Coq 8.13.0:
  // |Notation "{ A } + { B }" := (sumbool A B) : type_scope
  // |  (default interpretation)
  // |Notation "A + { B }" := (sumor A B) : type_scope (default interpretation)
  // |Notation "x + y" := (N.add x y) : N_scope
  // |...
  //
  // On Coq 8.12.0:
  // |Notation
  // |"{ A } + { B }" := sumbool A B : type_scope (default interpretation)
  // |"A + { B }" := sumor A B : type_scope (default interpretation)
  // |"x + y" := N.add x y : N_scope
  // |...
  response = response.trim();
  if (response === "Unknown notation") return;
  const notationRegex = /^(Reserved\s+)?Notation\s*"(.*?)"\s*:=\s*\(/gms;
  const matches = response.matchAll(notationRegex);
  if (!matches) return;

  const hover = [];
  for (const match of matches) {
    if (match.index === undefined) continue;
    const notation = match[2];
    const begin = match.index + match[0].length;
    const end = findClosingParenthese(response, begin);
    if (end === null) continue;
    const definition = compactify(response.slice(begin, end));
    hover.push(md_code_block("coq", `"${notation}" := ${definition}`));
  }
  if (hover.length === 0) {
    // Old coq version had a different locate format
    response = response.replace(/Notation\s*/gms, "");
    const old_matches = response.matchAll(/\s*"(.*?)"\s*:=\s*(.*)\s*:/gms);
    for (const match of old_matches) {
      const notation = match[1].trim();
      const definition = compactify(match[2].replace("(default interpretation)", ""));
      hover.push(md_code_block("coq", `"${notation}" := ${definition}`));
    }
  }
  return new vscode.Hover(hover);
}

// format the Expands to: xxx line returned by About queries
function formatExpandsTo(line: string) {
  const match_expands = line.match(/Expands to:\s+(\S+)(\s+.*)?/);
  if (match_expands !== null) {
    const md = new vscode.MarkdownString();
    md.appendMarkdown("**");
    md.appendText(match_expands[1]);
    md.appendMarkdown("**");
    if (match_expands[2]) {
      md.appendText(" " + match_expands[2].trim());
    }
    return md;
  }

  if (line.trim() === "Hypothesis of the goal context.") {
    return new vscode.MarkdownString("**Hypothesis**");
  }
  return null;
}

function formatAbout(response: string) {
  // response is the string printed by "About identifier."
  // |set_fold : ∀ A C : Type, Elements A C → ∀ B : Type, (A → B → B) → B → C → B
  // |
  // |set_fold is not universe polymorphic
  // |Arguments set_fold {A C}%type_scope {H} {B}%type_scope _%function_scope
  // |set_fold is transparent
  // |Expands to: Constant stdpp.fin_sets.set_fold
  //
  // Or
  // |set_fold not a defined object.
  //
  // Or
  // |Notation leibnizO A := (discreteO A)
  // |Expands to: Notation iris.algebra.ofe.leibnizO
  //
  // Or
  // |Notation z_to_addr := finz.of_z
  // |Expands to: Notation cap_machine.addr_reg.z_to_addr
  if (response.match(/not a defined object\./gs) !== null) return;

  if (response.startsWith("Notation")) {
    const array = response.split(/\n(?!\s)/gms); // split on newline NOT followed by space
    const hover: vscode.MarkdownString[] = []
    const match = array[0].match(/Notation\s+(.*?)\s+:=\s*/);
    if (match !== null) {
      const notation = match[1].trim();
      let definition = response.slice(match[0].length).trim();
      if (definition[0] === "(") {
        const end = findClosingParenthese(definition, 1);
        if (end !== null) {
          definition = definition.slice(1, end);
        }
      }
      else {
        definition = definition.split(/\s/, 1)[0];
      }
      hover.push(md_code_block("coq", `"${notation}" := ${compactify(definition)}`));
    }

    const expands_to = formatExpandsTo(array[1]);
    if (expands_to !== null) {
      hover.push(expands_to);
    }

    return new vscode.Hover(hover);
  }

  const array = response.split("\n\n"); // two newline between type and the rest
  let type = array[0];
  type = compactify(type.replace(/^.*?:/, "")); // remove identifier (everything before first ":")
  if (type === "") return;
  const hover = [md_code_block("coq", type)];

  // re-join all remaining sections of the array,
  // then split on newline NOT followed by space
  const details = array.slice(1).join("\n\n").split(/\n(?!\s)/gms);
  for (const detail of details) {
    if (detail.startsWith("Arguments ")) {
      const md = new vscode.MarkdownString("**Args:** `");
      md.appendMarkdown(detail.replace(/Arguments \S*\s*/, "").replace(/\s+/gms, " ").replace(/`/gms, "\\`") + '`');
      hover.push(md);
    }

    const expands_to = formatExpandsTo(detail);
    if (expands_to !== null) {
      hover.push(expands_to);
    }
  }
  return new vscode.Hover(hover);
}

// Perform a query to get hover text
async function query(query: "check" | "locate" | "about", text: string, project: CoqProject, document: vscode.TextDocument) {
  const doc = project.getOrCurrent(document.uri.toString());
  if (!doc) return;
  const response = await doc.hoverQuery(query, text);
  if (!response) return;
  if (query === "check") return formatCheck(response);
  if (query === "locate") return formatLocate(response);
  if (query === "about") return formatAbout(response);
  return;
}

// VS Code calls HoverProvider repeatedly
// So we memoize recent results to avoid having to requery
type query_result = { input: string, time: number, output: vscode.Hover };

let recent_queries: query_result[] = [];
const query_redo_delay = 2000; // milliseconds

function filterOld(query: query_result) {
  return Date.now() - query.time <= query_redo_delay;
}

export const regExpCoqNotation = /[^\p{Z}\p{C}"]+/u;

export function coqIdOrNotationFromRange(document: vscode.TextDocument, range: vscode.Range | undefined) {
  const text = document.getText(range);
  if (new RegExp("\^" + regExpCoqNotation.source + "\$", regExpCoqNotation.flags).test(text)
    && !new RegExp("\^" + editorAssist.regExpQualifiedCoqIdent.source + "\$", regExpCoqNotation.flags).test(text))
    return "\"" + text + "\"";
  return text;
}

async function query_input(input: string, project: CoqProject, document: vscode.TextDocument) {
  let is_notation = input[0] === "\"";

  // § Check if query was recently performed
  recent_queries = recent_queries.filter(filterOld);
  const has_query = recent_queries.filter((query) => query.input === input)[0];
  if (has_query)
    return has_query.output;

  // § if not, perform query
  const method = is_notation ? "locate" : project.settings.hoverFunction;
  let response = await query(method, input, project, document);
  if (!response && !is_notation) {
    // Something that looks like an identifier might in fact be a notation
    response = await query("locate", `"${input}"`, project, document);
    is_notation = true;
  }
  if (!response) return;

  // § Add query to recent queries
  recent_queries.push({ input, time: Date.now(), output: response });
  return response;
}

export async function provideHover(position: vscode.Position, project: CoqProject, document: vscode.TextDocument) {
  // § Get text under cursor
  const ranges =
    [
      // match largest non-space segment
      document.getWordRangeAtPosition(position, /\S+/),
      // match identifier
      document.getWordRangeAtPosition(position, editorAssist.regExpQualifiedCoqIdent),
      // match symbols
      document.getWordRangeAtPosition(position, regExpCoqNotation),
    ];

  for (const range of ranges) {
    if (range === undefined) continue;
    const input = coqIdOrNotationFromRange(document, range).trim();
    if (excludes.includes(input)) continue;

    const hover = await query_input(input, project, document);
    if (hover !== undefined) return hover;
  }
  return;
}
