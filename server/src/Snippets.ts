import {CompletionItem, CompletionItemKind, InsertTextFormat, CompletionList, CompletionItemTag} from 'vscode-languageserver';
import {SemVer, satisfies} from 'semver';


interface TriggerSnippet {
  label:string,
  insertText?: string,
  completion?: CompletionItem[],
  detail?: string,
  documentation?: string,
  addedIn?: string,
  removedIn?: string,
  deprecatredIn?: string
}

function snippetSentence(version : SemVer, item: TriggerSnippet) : CompletionItem {
  const result = CompletionItem.create(item.label);
  result.kind = CompletionItemKind.Snippet;
  result.detail = item.detail;
  result.documentation = item.documentation;

  if (item.insertText) {
    result.insertText = item.insertText;
    result.insertTextFormat = InsertTextFormat.Snippet;
  } else {
    result.insertText = item.label + ".";
  }

  if(item.completion) {
    result.command = {
      command: "editor.action.triggerSuggest",
      title: "Trigger Suggest"
    };
  }

  if (version && item.deprecatredIn && satisfies(version, ">= " + item.deprecatredIn))
    result.tags = [CompletionItemTag.Deprecated];

  return result;
}

function checkVersion(version : SemVer, item : TriggerSnippet) : boolean {
  if (version == null)
    return true;

  if (item.addedIn && satisfies(version, "< " + item.addedIn))
    return false;

  if (item.removedIn && satisfies(version, ">= " + item.removedIn))
    return false;

  return true;
}


const optionsSnippets : TriggerSnippet[] = [
  {label: "Allow StrictProp", addedIn: "8.10"},
  {label: "Apply With Renaming", addedIn: "8.15", deprecatredIn: "8.15", removedIn: "8.18"},
  {label: "Asymmetric Patterns", addedIn: "8.5"},
  {label: "Atomic Load", removedIn: "8.7"},
  {label: "Automatic Coercions Import", deprecatredIn: "8.7", removedIn: "8.10"},
  {label: "Automatic Introduction", deprecatredIn: "8.7", removedIn: "8.10"},
  {label: "Auto Template Polymorphism", addedIn: "8.10"},
  {label: "Boolean Equality Schemes"},
  {label: "Bracketing Last Introduction Pattern", deprecatredIn: "8.10", removedIn: "8.14"},
  {label: "Bullet Behavior", insertText: "Bullet Behavior \"${1|None,Strict Subproofs|}\"."},
  {label: "Case Analysis Schemes"},
  {label: "Compat Notations", removedIn: "8.6"},
  {label: "Congruence Depth", insertText: "Congruence Depth ${1:num}.", deprecatredIn: "8.7", removedIn: "8.11"},
  {label: "Congruence Verbose", removedIn: "8.14"},
  {label: "Contextual Implicit"},
  {label: "Coqtop Exit On Error", addedIn: "8.10"},
  {label: "Cumulative StrictProp", addedIn: "8.12"},
  {label: "Cumulativity Weak Constraints", addedIn: "8.8"},
  {label: "Debug", insertText:"Debug \"${1:ident}\".", addedIn: "8.14"},
  {label: "Debug Auto"},
  {label: "Debug Cbv", addedIn: "8.7", removedIn: "8.14"},
  {label: "Debug Eauto"},
  {label: "Debug Ltac", addedIn: "8.7", removedIn: "8.10"},
  {label: "Debug HO Unification", addedIn: "8.10", removedIn: "8.14"},
  {label: "Debug RAKAM", addedIn: "8.5", removedIn: "8.14"},
  {label: "Debug Tactic Unification", addedIn: "8.5", removedIn: "8.14"},
  {label: "Debug Trivial"},
  {label: "Debug Typeclasses", addedIn: "8.6", removedIn: "8.10"},
  {label: "Debug Unification", removedIn: "8.14"},
  {label: "Decidable Equality Schemes"},
  {label: "Default Clearing Used Hypotheses", addedIn: "8.5"},
  {label: "Default Goal Selector", insertText: "Default Goal Selector \"${1:selector}\".", addedIn: "8.5"},
  {label: "Default Proof Mode", insertText: "Default Proof Mode \"${1|Classic,Noedit,Ltac2|}\"."},
  {label: "Default Proof Using", insertText: "Default Proof Using \"${1:section_var_expr}\".", addedIn: "8.5"},
  {label: "Default Timeout", insertText: "Default Timeout ${1:num}."},
  {label: "Definitional UIP", addedIn: "8.13"},
  {label: "Dependent Propositions Elimination", deprecatredIn: "8.7", removedIn: "8.8"},
  {label: "Discriminate Introduction", deprecatredIn: "8.7", removedIn: "8.8"},
  {label: "Diffs", addedIn: "8.9"},
  {label: "Dump Bytecode", addedIn: "8.5"},
  {label: "Dump Lambda", addedIn: "8.8"},
  {label: "Elaboration StrictProp Cumulativity", addedIn: "8.10", removedIn: "8.18"},
  {label: "Elimination Schemes"},
  {label: "Equality Scheme", deprecatredIn: "8.4", removedIn: "8.7"},
  {label: "Extraction AccessOpaque"},
  {label: "Extraction AutoInline"},
  {label: "Extraction Conservative Types", addedIn: "8.5"},
  {label: "Extraction File Comment", insertText: "Extraction File Comment \"${1:string}\".", addedIn: "8.5"},
  {label: "Extraction Flag", insertText: "Extraction Flag ${1:num}."},
  {label: "Extraction KeepSingleton"},
  {label: "Extraction Optimize"},
  {label: "Extraction SafeImplicits", addedIn: "8.5"},
  {label: "Extraction TypeExpand"},
  {label: "Fast Name Printing", addedIn: "8.10"},
  {label: "Firstorder Depth", insertText: "Firstorder Depth ${1:num}."},
  {label: "Firstorder Solver", insertText: "Firstorder Solver ${1:ltac_expr}."},
  {label: "Function_debug", removedIn: "8.7"},
  {label: "Function_raw_tcc", removedIn: "8.7"},
  {label: "Functional Induction Rewrite Dependent", removedIn: "8.7"},
  {label: "Guard Checking", addedIn: "8.11"},
  {label: "Hide Obligations", deprecatredIn: "8.12", removedIn: "8.14"},
  {label: "Hyps Limit", insertText: "Hyps Limit ${1:num}."},
  {label: "Implicit Arguments"},
  {label: "Info Auto"},
  {label: "Info Eauto"},
  {label: "Info Level", insertText: "Info Level ${1:num}.", addedIn: "8.5"},
  {label: "Info Trivial"},
  {label: "Injection L2R Pattern Order", deprecatredIn: "8.7", removedIn: "8.8"},
  {label: "Injection On Proofs", removedIn: "8.6"},
  {label: "Inline Level", insertText: "Inline Level ${1:num}."},
  {label: "Instance Generalized Output", addedIn: "8.13", deprecatredIn: "8.13", removedIn: "8.15"},
  {label: "Intuition Iff Unfolding", deprecatredIn: "8.7", removedIn: "8.8"},
  {label: "Intuition Negation Unfolding", addedIn: "8.5"},
  {label: "Keep Admitted Variables", addedIn: "8.5"},
  {label: "Keep Proof Equalities", addedIn: "8.6"},
  {label: "Kernel Term Sharing", addedIn: "8.5"},
  {label: "Keyed Unification", addedIn: "8.5"},
  {label: "Loose Hint Behavior", insertText: "Loose Hint Behavior \"${1|Lax,Warn,Strict|}\".", addedIn: "8.5"},
  {label: "Ltac Backtrace", addedIn: "8.10"},
  {label: "Ltac Batch Debug", addedIn: "8.7"},
  {label: "Ltac Debug"},
  {label: "Ltac Profiling", addedIn: "8.6"},
  {label: "Mangle Names", addedIn: "8.8"},
  {label: "Mangle Names Light", addedIn: "8.15"},
  {label: "Mangle Names Prefix", insertText: "Mangle Names Prefix \"${1:string}\"."},
  {label: "Maximal Implicit Insertion"},
  {label: "NativeCompute Profile Filename", insertText: "NativeCompute Profile Filename \"${1:string}\".", addedIn: "8.8"},
  {label: "NativeCompute Profiling", addedIn: "8.8"},
  {label: "NativeCompute Timing", addedIn: "8.12"},
  {label: "Nested Proofs Allowed", addedIn: "8.9"},
  {label: "Nonrecursive Elimination Schemes", addedIn: "8.5"},
  {label: "Parsing Explicit"},
  {label: "Polymorphic Inductive Cumulativity", addedIn: "8.7"},
  {label: "Positivity Checking", addedIn: "8.11"},
  {label: "Primitive Projections", addedIn: "8.5"},
  {label: "Printing All"},
  {label: "Printing Allow Match Default Clause", addedIn: "8.8"},
  {label: "Printing Coercions"},
  {label: "Printing Compact Contexts", addedIn: "8.7"},
  {label: "Printing Dependent Evars Line", addedIn: "8.6"},
  {label: "Printing Depth", insertText: "Printing Depth ${1:num}."},
  {label: "Printing Existential Instances"},
  {label: "Printing Factorizable Match Patterns", addedIn: "8.8"},
  {label: "Printing Float", addedIn: "8.13"},
  {label: "Printing Goal Names", addedIn: "8.7"},
  {label: "Printing Goal Tags", addedIn: "8.7"},
  {label: "Printing Implicit"},
  {label: "Printing Implicit Defensive"},
  {label: "Printing Match All Subterms", addedIn: "8.18"},
  {label: "Printing Matching"},
  {label: "Printing Notations"},
  {label: "Printing Parentheses", addedIn: "8.12"},
  {label: "Printing Primitive Projection Compatibility", addedIn: "8.5", removedIn: "8.10"},
  {label: "Printing Primitive Projection Parameters", addedIn: "8.5"},
  {label: "Printing Projections"},
  {label: "Printing Raw Literals", addedIn: "8.14"},
  {label: "Printing Records"},
  {label: "Printing Synth"},
  {label: "Printing Unfocused", addedIn: "8.7"},
  {label: "Printing Unfolded Projection As Match", addedIn: "8.18"},
  {label: "Printing Universes"},
  {label: "Printing Use Implicit Types", addedIn: "8.12"},
  {label: "Printing Width", insertText: "Printing Width ${1:num}."},
  {label: "Printing Wildcard"},
  {label: "Private Polymorphic Universes", addedIn: "8.10"},
  {label: "Program Cases", addedIn: "8.6"},
  {label: "Program Generalized Coercion", addedIn: "8.6"},
  {label: "Program Mode", addedIn: "8.5"},
  {label: "Program Naming", addedIn: "8.16", deprecatredIn: "8.16", removedIn: "8.17"},
  {label: "Proof Using Clear Unused", addedIn: "8.5", removedIn: "8.10"},
  {label: "Record Elimination Schemes", deprecatredIn: "8.5", removedIn: "8.8"},
  {label: "Refine Instance Mode", addedIn: "8.5", deprecatredIn: "8.10", removedIn: "8.11"},
  {label: "Refolding Reduction", addedIn: "8.6", deprecatredIn: "8.7", removedIn: "8.8"},
  {label: "Regular Subst Tactic", addedIn: "8.5", deprecatredIn: "8.14", removedIn: "8.15"},
  {label: "Reversible Pattern Implicit"},
  {label: "Rewriting Schemes"},
  {label: "Search Output Name Only", addedIn: "8.6"},
  {label: "Short Module Printing"},
  {label: "Shrink Abstract", deprecatredIn: "8.6", removedIn: "8.8"},
  {label: "Shrink Obligations", deprecatredIn: "8.6", removedIn: "8.12"},
  {label: "Silent"},
  {label: "SimplIsCbn"},
  {label: "Solve Unification Constraints", addedIn: "8.6"},
  {label: "Standard Proposition Elimination Names", deprecatredIn: "8.7", removedIn: "8.8"},
  {label: "Strict Implicit"},
  {label: "Strict Proofs", removedIn: "8.7"},
  {label: "Strict Universe Declaration"},
  {label: "Strongly Strict Implicit"},
  {label: "Structural Injection", addedIn: "8.6"},
  {label: "Suggest Proof Using"},
  {label: "Tactic Compat Context", deprecatredIn: "8.7", removedIn: "8.8"},
  {label: "Tactic Evars Pattern Unification", deprecatredIn: "8.5", removedIn: "8.7"},
  {label: "Tactic Pattern Unification", deprecatredIn: "8.7", "removedIn": "8.8"},
  {label: "Template Check", addedIn: "8.10", deprecatredIn: "8.10", removedIn: "8.12"},
  {label: "Transparent Obligations"},
  {label: "Typeclass Resolution After Apply", deprecatredIn: "8.6", removedIn: "8.8"},
  {label: "Typeclass Resolution For Conversion"},
  {label: "Typeclasses Axioms Are Instances", addedIn: "8.8", deprecatredIn: "8.10", removedIn: "8.12"},
  {label: "Typeclasses Debug"},
  {label: "Typeclasses Debug Verbosity", insertText: "Typeclasses Debug Verbosity ${1:num}.", addedIn: "8.6"},
  {label: "Typeclasses Dependency Order"},
  {label: "Typeclasses Depth", insertText: "Typeclasses Depth ${1:num}."},
  {label: "Typeclasses Filtered Unification", addedIn: "8.6", deprecatredIn: "8.16", removedIn: "8.18"},
  {label: "Typeclasses Iterative Deepening", addedIn: "8.6"},
  {label: "Typeclasses Legacy Resolution", addedIn: "8.6", deprecatredIn: "8.7", removedIn: "8.8"},
  {label: "Typeclasses Limit Intros", addedIn: "8.6"},
  {label: "Typeclasses Modulo Eta", deprecatredIn: "8.6", removedIn: "8.8"},
  {label: "Typeclasses Strict Resolution"},
  {label: "Typeclasses Unique Instances"},
  {label: "Typeclasses Unique Solutions"},
  {label: "Undo", deprecatredIn: "8.4",removedIn: "8.7"},
  {label: "Uniform Inductive Parameters", addedIn: "8.9"},
  {label: "Universal Lemma Under Conjunction", deprecatredIn: "8.15", removedIn: "8.16"},
  {label: "Universe Checking", addedIn: "8.11"},
  {label: "Universe Minimization ToSet"},
  {label: "Universe Polymorphism"},
  {label: "Verbose Compat Notations", removedIn: "8.6"},
  {label: "Warnings", insertText: "Warnings \"${1:ident}\"", addedIn: "8.6"},
];

const rawTableSnippets : TriggerSnippet[] = [
  {label: "Keep Equalities", addedIn: "8.15"},
  {label: "Printing Coercion"},
  {label: "Printing Constructor"},
  {label: "Printing If"},
  {label: "Printing Let"},
  {label: "Printing Record"},
  {label: "Search Blacklist"},
];

const printSnippets : TriggerSnippet[] = [
  {label: "(definition)", insertText: "${1:qualid}."},
  {label: "All"},
  {label: "All Dependencies", insertText: "All Dependencies ${1:qualid}."},
  {label: "Assumptions", insertText: "Assumptions ${1:qualid}."},
  {label: "Canonical Projections", removedIn: "8.12"},
  {label: "Canonical Projections", insertText: "Canonical Projections ${1:qualid}.", addedIn: "8.12"},
  {label: "Classes"},
  {label: "Coercion Paths", insertText: "Coercion Paths ${1:class1} ${2:class2}."},
  {label: "Coercions"},
  {label: "Custom Grammar", insertText: "Custom Grammar ${1:ident}.", addedIn: "8.10"},
  {label: "Debug GC"},
  {label: "Extraction Blacklist"},
  {label: "Extraction Inline"},
  {label: "Equivalent Keys"},
  {label: "Firstorder Solver"},
  {label: "Fields"},
  {label: "Grammar", insertText: "Grammar ${1|constr,pattern,tactic,vernac,ltac2|}."},
  {label: "Graph"},
  {label: "Hint", insertText: "Hint ${1:ident}."},
  {label: "Hint *"},
  {label: "HintDb", insertText: "HintDb ${1:ident}."},
  {label: "Implicit", insertText: "Implicit ${1:qualid}."},
  {label: "Instances", insertText: "Instances ${1:qualid}."},
  {label: "Keywords", addedIn: "8.17"},
  {label: "Libraries"},
  {label: "LoadPath"},
  {label: "Ltac", insertText: "Ltac ${1:qualid}."},
  {label: "Ltac Signatures", addedIn: "8.6"},
  {label: "Ltac2", insertText: "Ltac2 ${1:qualid}.", addedIn: "8.11"},
  {label: "ML Modules"},
  {label: "ML Path"},
  {label: "Module", insertText: "Module ${1:ident}."},
  {label: "Module Type", insertText: "Module Type ${1:ident}."},
  {label: "Notation", insertText: "Notation \"${1:string}\".", addedIn: "8.16"},
  {label: "Namespace", insertText: "Namespace ${1:dirpath}."},
  {label: "Opaque Dependencies", insertText: "Opaque Dependencies ${1:qualid}."},
  {label: "Options"},
  {label: "Rewrite HintDb", insertText: "Rewrite HintDb ${1:ident}."},
  {label: "Rings"},
  {label: "Scope", insertText: "Scope ${1:scope}."},
  {label: "Scopes"},
  {label: "Section", insertText: "Section ${1:ident}."},
  {label: "Sorted Universes"},
  {label: "Sorted Universes (filename)", insertText: "Sorted Universes \"${1:filename}\"."},
  {label: "Strategies"},
  {label: "Strategy", insertText: "Strategy ${1:qualid}."},
  {label: "Table", insertText: "Table ${1:table}."},
  {label: "Tables"},
  {label: "Term", insertText: "Term ${1:qualid}."},
  {label: "Transparent Dependencies", insertText: "Transparent Dependencies ${1:qualid}."},
  {label: "Typeclasses", addedIn: "8.17"},
  {label: "Typing Flags", addedIn: "8.11"},
  {label: "Universes"},
  {label: "Universes (filename)", insertText: "Universes \"${1:filename}\"."},
  {label: "Visibility"},
];

const showSnippets : TriggerSnippet[] = [
  {label: "(num)", insertText: "${1:num}.", documentation: "Displays only the num-th subgoal"},
  {label: "Conjectures"},
  {label: "Existentials"},
  {label: "Intro"},
  {label: "Intros"},
  {label: "Match", insertText: "Match ${1:qualid}."},
  {label: "Proof"},
  {label: "Script", deprecatredIn: "8.10", removedIn: "8.11"},
  {label: "Universes"},
];

const hintSnippets : TriggerSnippet[] = [
  {label: "Constants", insertText: "Constants ${1|Opaque,Transparent|} : ${2:idents …}.", addedIn: "8.9"},
  {label: "Constructors", insertText: "Constructors ${1:idents …} : ${2:idents …}."},
  {label: 'Cut', insertText: 'Cut [${1:regexp}] : ${2:idents …}.'},
  {label: 'Extern', insertText: 'Extern ${1:num} ${2:optional-pattern} => ${3:tactic} : ${4:idents …}.'},
  {label: 'Immediate', insertText: 'Immediate ${1:term} : ${2:idents …}.'},
  {label: 'Mode', insertText: 'Mode ${1:qualid} ${2:(+|-|!)+} : ${3:idents …}.'},
  {label: 'Opaque', insertText: 'Opaque ${1:qualid} : ${2:idents …}.'},
  {label: 'Resolve', insertText: 'Resolve ${1:term} : ${2:idents …}.'},
  {label: 'Rewrite', insertText: 'Rewrite ${1:terms …} : ${2:idents …}.'},
  {label: 'Rewrite ->', insertText: 'Rewrite -> ${1:terms …} : ${2:idents …}.'},
  {label: 'Rewrite <-', insertText: 'Rewrite <- ${1:terms …} : ${2:idents …}.'},
  {label: 'Transparent', insertText: 'Transparent ${1:qualid} : ${2:idents …}.'},
  {label: 'Unfold', insertText: 'Unfold ${1:qualid} : ${2:idents …}.'},
  {label: "Variables", insertText: "Variables ${1|Opaque,Transparent|} : ${2:idents …}.", addedIn: "8.9"},
];


function buildTriggerSnippets(version : SemVer) : TriggerSnippet[] {
  const _rawOptionsSnippets = optionsSnippets
    .filter((item) => checkVersion(version, item))
    .map((item) => {return {...item, insertText: undefined}})
    .map((item) => snippetSentence(version, item));
  const _optionsSnippets = optionsSnippets
    .filter((item) => checkVersion(version, item))
    .map((item) => snippetSentence(version, item));
  const _rawTableSnippets = rawTableSnippets
    .filter((item) => checkVersion(version, item))
    .map((item) => snippetSentence(version, item));
  const _tableSnippets = rawTableSnippets
    .filter((item) => checkVersion(version, item))
    .map((item) => {return {...item, insertText: item.label + " ${1:qualid}."}})
    .map((item) => snippetSentence(version, item));
  const _printSnippets = printSnippets
    .filter((item) => checkVersion(version, item))
    .map((item) => snippetSentence(version, item));
  const _showSnippets = showSnippets
    .filter((item) => checkVersion(version, item))
    .map((item) => snippetSentence(version, item));
  const _hintSnippets = hintSnippets
    .filter((item) => checkVersion(version, item))
    .map((item) => snippetSentence(version, item));
  
  return [
  {label: "Set...", insertText: "Set ", completion: _optionsSnippets, detail: "Set coqtop options"},
  {label: "Unset...", insertText: "Unset ", completion: _rawOptionsSnippets, detail: "Unset coqtop options"},
  {label: "Local Set...", insertText: "Local Set ", completion: _optionsSnippets},
  {label: "Global Unset...", insertText: "Global Unset ", completion: _rawOptionsSnippets},
  {label: "Test...", insertText: "Test ", completion: [..._rawOptionsSnippets, ..._rawTableSnippets]},
  {label: "Add...", insertText: "Add ", completion: _tableSnippets},
  {label: "Remove...", insertText: "Remove ", completion: _tableSnippets},
  {label: "Print...", insertText: "Print ", completion: _printSnippets},
  {label: "Show...", insertText: "Show ", completion: _showSnippets},
  {label: "Hint...", insertText: "Hint ", completion: _hintSnippets},
  {label: "Local Hint...", insertText: "Local Hint ", completion: _hintSnippets},
  {label: "Global Hint...", insertText: "Global Hint ", completion: _hintSnippets},
  {label: "Export Hint...", insertText: "#[export] Hint ", completion: _hintSnippets},
  {label: "Arguments", insertText: "Arguments ${1:qualid} ${2:possibly_bracketed_idents …}."},
  {label: "Local Arguments", insertText: "Local Arguments ${1:qualid} ${2:possibly_bracketed_idents …}."},
  {label: "Global Arguments", insertText: "Global Arguments ${1:qualid} ${2:possibly_bracketed_idents …}."},
]};

function buildTriggerRegexp(version : SemVer) : RegExp {
  const snippets = triggerSnippets.get(version);
  return RegExp(`\\s*(?:${snippets.map((v) => "(" + escapeRegExp(v.insertText) + ")").join('|')})\\s*$`);
}

let triggerRegexp = new Map<SemVer, RegExp>();
let triggerSnippets = new Map<SemVer, TriggerSnippet[]>();

function getTriggerSnippet(str: string, version : SemVer) : TriggerSnippet|null {
  const match = triggerRegexp.get(version).exec(str);
  if(match && match.length > 1) {
    match.shift();
    const triggerIdx = match.findIndex((v) => v!==undefined)
    return triggerSnippets.get(version)[triggerIdx];
  } else
    return null;
}

function getTriggerCompletions(prefix: string, version : SemVer) {
  const triggerCompletions = CompletionList.create(
    triggerSnippets.get(version)
    .filter((trigger) => {
      return trigger.insertText.startsWith(prefix);
    })
    .map((item) => snippetSentence(version, item)), true);
  return triggerCompletions;
}

/** see: http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex */
function escapeRegExp(str : string) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

export function getSnippetCompletions(prefix: string, version: SemVer): CompletionList | CompletionItem[] {
  if(prefix === "")
    return [];

  if (!triggerSnippets.has(version)) {
    triggerSnippets.set(version, buildTriggerSnippets(version));
    triggerRegexp.set(version, buildTriggerRegexp(version));
  }
  
  const trigger = getTriggerSnippet(prefix, version);
  if(trigger)
    return trigger.completion;
  else
    return getTriggerCompletions(prefix.trim(), version);
}
