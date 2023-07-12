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
  ]
};

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

const tacticSnippets: TriggerSnippet[] = [
  {label: "abstract", insertText: "abstract ${1:tactic}."},
  {label: "absurd", insertText: "absurd ${1:term}."},
  {label: "admit"},
  {label: "apply", insertText: "apply ${1:term}."},
  {label: "apply in", insertText: "apply ${1:term} in ${2:ident}."},
  {label: "assert", insertText: "assert (${1:ident} : ${2:type})."},
  {label: "assert_fails", insertText: "assert_fails ${1:tactic}."},
  {label: "assert_succeeds", insertText: "assert_succeeds ${1:tactic}."},
  {label: "assumption"},
  {label: "auto"},
  {label: "auto with", insertText: "auto with ${1:ident}."},
  {label: "auto using", insertText: "auto using ${1:term}."},
  {label: "autoapply", insertText: "autoapply ${1:term} with ${2:ident}."},
  {label: "autorewrite", insertText: "autorewrite with ${1:ident}."},
  {label: "autounfold", insertText: "autounfold ${1:hintbases}."},
  {label: "autounfold_one", insertText: "autounfold_one ${1:hintbases}."},
  {label: "btauto"},
  {label: "by", insertText: "by ${1:tactic}."},
  {label: "case", insertText: "case ${1:term}."},
  {label: "case_eq", insertText: "case_eq ${1:term}."},
  {label: "cbn"},
  {label: "cbv"},
  {label: "change", insertText: "change ${1:term} with ${2:term}."},
  {label: "change_no_check", insertText: "change_no_check ${1:term} with ${2:term}."},
  {label: "classical_left"},
  {label: "classical_right"},
  {label: "clear", insertText: "clear ${1:ident}."},
  {label: "clear dependent", insertText: "clear dependent ${1:ident}."},
  {label: "clearbody", insertText: "clearbody ${1:ident}."},
  {label: "cofix", insertText: "cofix ${1:ident}."},
  {label: "cofix with", insertText: "cofix ${1:ident} with (${2:ident} : ${3:type})."},
  {label: "compare", insertText: "compare ${1:term} ${2:term}."},
  {label: "compute"},
  {label: "congr", insertText: "congr ${1:term}."},
  {label: "congruence"},
  {label: "constr_eq", insertText: "constr_eq ${1:term} ${2:term}."},
  {label: "constr_eq_nounivs", insertText: "constr_eq_nounivs ${1:term} ${2:term}."},
  {label: "constr_eq_strict", insertText: "constr_eq_strict ${1:term} ${2:term}."},
  {label: "constructor"},
  {label: "context", insertText: "context ${1:ident} [ ${2:term} ]"},
  {label: "contradict", insertText: "contradict ${1:ident}."},
  {label: "contradiction"},
  {label: "cut", insertText: "cut ${1:type}."},
  {label: "cutrewrite", insertText: "cutrewrite ${1|<-,->|} ${2:type}."},
  {label: "cycle", insertText: "cycle ${1:num}."},
  {label: "debug auto"},
  {label: "debug eauto"},
  {label: "debug trivial"},
  {label: "decide", insertText: "decide ${1:term} with ${2:term}."},
  {label: "decide equality"},
  {label: "decompose", insertText: "decompose [ ${1:term} ] ${2:term}."},
  {label: "decompose record", insertText: "decompose record ${1:term}."},
  {label: "decompose sum", insertText: "decompose sum ${1:term}."},
  {label: "dependent destruction", insertText: "dependent destruction ${1:ident}."},
  {label: "dependent generalize_eqs", insertText: "dependent generalize_eqs ${1:ident}."},
  {label: "dependent generalize_eqs_vars", insertText: "dependent generalize_eqs_vars ${1:ident}."},
  {label: "dependent induction", insertText: "dependent induction ${1:ident}."},
  {label: "dependent inversion", insertText: "dependent inversion ${1:ident}."},
  {label: "dependent inversion_clear", insertText: "dependent inversion_clear ${1:ident}."},
  {label: "dependent rewrite", insertText: "dependent rewrite ${1|<-,->|} ${2:term}."},
  {label: "dependent rewrite in", insertText: "dependent rewrite ${1|<-,->|} ${2:term} in ${3:ident}."},
  {label: "dependent simple inversion", insertText: "dependent simple inversion ${1:ident}."},
  {label: "destauto"},
  {label: "destruct", insertText: "destruct ${1:term}."},
  {label: "dfs eauto"},
  {label: "dintuition"},
  {label: "discriminate"},
  {label: "discrR"},
  {label: "do", insertText: "do ${3:nat} ${3:tactic}."},
  {label: "done"},
  {label: "dtauto"},
  {label: "eapply", insertText: "eapply ${1:term}."},
  {label: "eapply in", insertText: "eapply ${1:term} in ${2:ident}."},
  {label: "eassert", insertText: "eassert (${1:ident} : ${2:type})."},
  {label: "eassumption"},
  {label: "easy"},
  {label: "eauto"},
  {label: "ecase", insertText: "ecase ${1:term}."},
  {label: "econstructor"},
  {label: "edestruct", insertText: "edestruct ${1:term}."},
  {label: "ediscriminate"},
  {label: "eelim", insertText: "eelim ${1:term}."},
  {label: "eenough", insertText: "eenough (${1:ident} : ${2:type})."},
  {label: "eexact", insertText: "eexact ${1:term}."},
  {label: "eexists"},
  {label: "einduction", insertText: "einduction ${1:ident}."},
  {label: "einjection", insertText: "einjection ${1:ident}."},
  {label: "eintros"},
  {label: "eleft"},
  {label: "elim", insertText: "elim ${1:term}."},
  {label: "enough", insertText: "enough (${1:ident} : ${2:type})."},
  {label: "epose", insertText: "epose ${1:term}."},
  {label: "epose proof", insertText: "epose proof (${1:ident} := ${2:term})."},
  {label: "eremember", insertText: "eremember ${1:term}."},
  {label: "erewrite", insertText: "erewrite ${1|<-,->|} ${2:term}."},
  {label: "eright"},
  {label: "eset", insertText: "eset (${1:ident} := ${2:term})."},
  {label: "esimplify_eq", insertText: "esimplify_eq ${1:term}."},
  {label: "esplit"},
  {label: "etransitivity"},
  {label: "eval", insertText: "eval ${1:red_expr} in ${2:term}."},
  {label: "evar", insertText: "evar (${1:ident} : ${2:type})."},
  {label: "exact", insertText: "exact ${1:term}."},
  {label: "exact_no_check", insertText: "exact_no_check ${1:term}."},
  {label: "exactly_once", insertText: "exactly_once ${1:tactic}."},
  {label: "exfalso"},
  {label: "exists", insertText: "exists ${1:bindings}."},
  {label: "f_equal"},
  {label: "fail"},
  {label: "field"},
  {label: "field_simplify", insertText: "field_simplify ${1:term}."},
  {label: "field_simplify_eq"},
  {label: "finish_timing"},
  {label: "first", insertText: "first [ ${1:tactic} ]."},
  {label: "first last"},
  {label: "firstorder"},
  {label: "fix", insertText: "fix ${1:ident} ${2:nat}."},
  {label: "fold", insertText: "fold ${1:term}."},
  {label: "fresh", insertText: "fresh \"${1:string}\"."},
  {label: "fun", insertText: "fun ${1:name} => ${1:tactic}."},
  {label: "functional induction", insertText: "functional induction ${1:term}."},
  {label: "functional inversion", insertText: "functional inversion ${1:ident}."},
  {label: "generalize", insertText: "generalize ${1:term}."},
  {label: "generalize dependent", insertText: "generalize dependent ${1:term}."},
  {label: "generalize_eqs", insertText: "generalize_eqs ${1:ident}."},
  {label: "generalize_eqs_vars", insertText: "generalize_eqs_vars ${1:ident}."},
  {label: "gfail"},
  {label: "gintuition"},
  {label: "give_up"},
  {label: "guard", insertText: "guard ${1:int_or_var} ${2|=,<,<=,>,>=|} ${3:int_or_var}."},
  {label: "has_evar", insertText: "has_evar ${1:term}."},
  {label: "have", insertText: "have: ${1:term}."},
  {label: "hget_evar", insertText: "hget_evar: ${1:nat_or_var}."},
  {label: "hnf"},
  {label: "hresolve_core", insertText: "hresolve_core (${1:ident} := ${2:term}) in ${3:term}."},
  {label: "idtac"},
  {label: "induction", insertText: "induction ${1:term}."},
  {label: "info_auto"},
  {label: "info_eauto"},
  {label: "info_trivial"},
  {label: "injection", insertText: "injection ${1:ident}."},
  {label: "instantiate", insertText: "instantiate (${1:ident} := ${2:term})."},
  {label: "intro"},
  {label: "intros"},
  {label: "intros until", insertText: "intros until ${1:ident}."},
  {label: "intuition"},
  {label: "inversion", insertText: "inversion ${1:ident}."},
  {label: "inversion_clear", insertText: "inversion_clear ${1:ident}."},
  {label: "inversion_sigma", insertText: "inversion_sigma ${1:ident}."},
  {label: "is_cofix", insertText: "is_cofix ${1:term}."},
  {label: "is_const", insertText: "is_const ${1:term}."},
  {label: "is_constructor", insertText: "is_constructor ${1:term}."},
  {label: "is_evar", insertText: "is_evar ${1:term}."},
  {label: "is_fix", insertText: "is_fix ${1:term}."},
  {label: "is_ground", insertText: "is_ground ${1:term}."},
  {label: "is_ind", insertText: "is_ind ${1:term}."},
  {label: "is_proj", insertText: "is_proj ${1:term}."},
  {label: "is_var", insertText: "is_var ${1:term}."},
  {label: "lapply", insertText: "lapply ${1:ident}."},
  {label: "last"},
  {label: "last first"},
  {label: "lazy"},
  {label: "lazymatch", insertText: "lazymatch ${1:term} with\n| ${2:pattern} => ${3:tactc}\nend."},
  {label: "lazymatch goal", insertText: "lazymatch goal with\n| ${1:pattern} => ${2:tactc}\nend."},
  {label: "left"},
  {label: "let", insertText: "let ${1:ident} := ${2:tactic} in ${3:tactic}."},
  {label: "lia"},
  {label: "lra"},
  {label: "match", insertText: "match ${1:term} with\n| ${2:pattern} => ${3:tactc}\nend."},
  {label: "match goal", insertText: "match goal with\n| ${1:pattern} => ${2:tactc}\nend."},
  {label: "move", insertText: "move ${1:ident} ${2|at top,at bottom,before,after|}."},
  {label: "multimatch", insertText: "multimatch ${1:term} with\n| ${2:pattern} => ${3:tactc}\nend."},
  {label: "multimatch goal", insertText: "multimatch goal with\n| ${1:pattern} => ${2:tactc}\nend."},
  {label: "native_cast_no_check", insertText: "native_cast_no_check ${1:term}."},
  {label: "native_compute"},
  {label: "nia"},
  {label: "not_evar", insertText: "not_evar ${1:term}."},
  {label: "now", insertText: "now ${1:tactic}."},
  {label: "now_show", insertText: "now_show ${1:type}."},
  {label: "nra"},
  {label: "nsatz"},
  {label: "nsatz_compute", insertText: "nsatz_compute ${1:term}."},
  {label: "numgoals"},
  {label: "once", insertText: "once ${1:tactic}."},
  {label: "only", insertText: "only ${1:nat} : ${2:tactic}."},
  {label: "optimize_heap"},
  {label: "over"},
  {label: "pattern"},
  {label: "pose", insertText: "pose (${1:ident} := ${2:term})."},
  {label: "pose proof", insertText: "pose proof (${1:ident} := ${2:term})."},
  {label: "progress", insertText: "progress ${1:tactic}."},
  {label: "psatz"},
  {label: "rapply", insertText: "rapply ${1:term}."},
  {label: "red"},
  {label: "refine", insertText: "refine ${1:term}."},
  {label: "reflexivity"},
  {label: "remember", insertText: "remember ${1:term}."},
  {label: "rename", insertText: "rename ${1:ident} in ${2:ident}."},
  {label: "repeat", insertText: "repeat ${1:tactic}."},
  {label: "replace", insertText: "relace ${1:term} with ${2:term}."},
  {label: "reset ltac profile"},
  {label: "restart_timer"},
  {label: "revert", insertText: "revert ${1:ident}."},
  {label: "revert dependent", insertText: "revert dependent ${1:ident}."},
  {label: "revgoals"},
  {label: "rewrite", insertText: "rewrite ${1|<-,->|} ${2:term}."},
  {label: "rewrite in", insertText: "rewrite ${1|<-,->|} ${2:term} in ${3:ident}."},
  {label: "rewrite *", insertText: "rewrite * ${1|<-,->|} ${2:term}."},
  {label: "rewrite_db", insertText: "revert_db ${1:ident}."},
  {label: "rewrite_strat", insertText: "rewrite_strat ${1:rewstrategy}."},
  {label: "right"},
  {label: "ring"},
  {label: "ring_lookup"},
  {label: "ring_simplify"},
  {label: "rtauto"},
  {label: "set", insertText: "set (${1:ident} := ${2:term})."},
  {label: "setoid_etransitivity"},
  {label: "setoid_reflexivity"},
  {label: "setoid_replace", insertText: "setoid_relace ${1:term} with ${2:term}."},
  {label: "setoid_rewrite", insertText: "setoid_rewrite ${1|<-,->|} ${2:term}."},
  {label: "setoid_symmetry"},
  {label: "setoid_transitivity", insertText: "setoid_transitivity ${1:term}."},
  {label: "shelve"},
  {label: "shelve_unifiable"},
  {label: "show ltac profile"},
  {label: "simpl"},
  {label: "simple apply", insertText: "simple apply ${1:term}."},
  {label: "simple congruence"},
  {label: "simple destruct", insertText: "simple destruct ${1:ident}."},
  {label: "simple eapply", insertText: "simple eapply ${1:term}."},
  {label: "simple induction", insertText: "simple induction ${1:ident}."},
  {label: "simple injection", insertText: "simple injection ${1:ident}."},
  {label: "simple inversion", insertText: "simple inversion ${1:ident}."},
  {label: "simple subst"},
  {label: "simplify_eq", insertText: "simplify_eq ${1:term}."},
  {label: "soft functional induction", insertText: "soft functional induction ${1:term}."},
  {label: "solve", insertText: "solve [ ${1:tactic} ]."},
  {label: "solve_constraints"},
  {label: "specialize", insertText: "specialize ${1:term}."},
  {label: "specialize_eqs", insertText: "specialize_eqs ${1:ident}."},
  {label: "split"},
  {label: "split_Rabs"},
  {label: "split_Rmult"},
  {label: "start ltac profiling"},
  {label: "stepl", insertText: "stepl ${1:term}."},
  {label: "stepr", insertText: "stepr ${1:term}."},
  {label: "stop ltac profiling"},
  {label: "subst"},
  {label: "substitute", insertText: "substitute ${1:term}."},
  {label: "suff"},
  {label: "suffices"},
  {label: "swap", insertText: "sawp ${1:int_or_var} ${2:int_or_var}."},
  {label: "symmetry"},
  {label: "tauto"},
  {label: "time", insertText: "time ${1:tactic}."},
  {label: "time_constr", insertText: "time_constr ${1:tactic}."},
  {label: "timeout", insertText: "timeout ${1:nat_or_var} ${2:tactic}."},
  {label: "transitivity", insertText: "transitivity ${1:term}."},
  {label: "transparent_abstract", insertText: "transparent_abstract ${1:tactic}."},
  {label: "trivial"},
  {label: "try", insertText: "try ${1:tactic}."},
  {label: "tryif", insertText: "tryif ${1:tactic} then ${2:tactic} else ${3:tactic}."},
  {label: "type of", insertText: "type of ${1:term}."},
  {label: "type_term", insertText: "type_term ${1:term}."},
  {label: "typeclasses eauto"},
  {label: "under", insertText: "under ${1:term} => ${2:term} do ${3:tactic}."},
  {label: "unfold", insertText: "unfold ${1:ident}."},
  {label: "unify", insertText: "unify ${1:term} ${2:term}."},
  {label: "unlock", insertText: "unlock ${1:ident}."},
  {label: "unshelve", insertText: "unshelve ${1:tactic}."},
  {label: "vm_cast_no_check", insertText: "vm_cast_no_check ${1:term}."},
  {label: "vm_compute"},
  {label: "with_strategy", insertText: "with_strategy ${1:level} [ ${1:reference} ] ${1:tactic}."},
  {label: "without loss"},
  {label: "wlia", insertText: "wlia ${1:ident} ${2:term}."},
  {label: "wlog"},
  {label: "wlra_Q", insertText: "wlra_Q ${1:ident} ${2:term}."},
  {label: "wnia", insertText: "wnia ${1:ident} ${2:term}."},
  {label: "wnra_Q", insertText: "wnra_Q ${1:ident} ${2:term}."},
  {label: "wpsatz_Q", insertText: "wpsatz_Q ${1:nat} ${2:ident} ${3:term}."},
  {label: "wpsatz_Z", insertText: "wpsatz_Z ${1:nat} ${2:ident} ${3:term}."},
  {label: "wsos_Q", insertText: "wsos_Q ${1:ident} ${2:term}."},
  {label: "wsos_Z", insertText: "wsos_Z ${1:ident} ${2:term}."},
  {label: "xlia", insertText: "xlia ${1:tactic}."},
  {label: "xlra_Q", insertText: "xlra_Q ${1:tactic}."},
  {label: "xlra_R", insertText: "xlra_R ${1:tactic}."},
  {label: "xnia", insertText: "xnia ${1:tactic}."},
  {label: "xnra_Q", insertText: "xnra_Q ${1:tactic}."},
  {label: "xnra_R", insertText: "xnra_R ${1:tactic}."},
  {label: "xpsatz_Q", insertText: "xpsatz_Q ${1:nat} ${2:tactic}."},
  {label: "xpsatz_R", insertText: "xpsatz_R ${1:nat} ${2:tactic}."},
  {label: "xpsatz_Z", insertText: "xpsatz_Z ${1:nat} ${2:tactic}."},
  {label: "xsos_Q", insertText: "xsos_Q ${1:tactic}."},
  {label: "xsos_R", insertText: "xsos_R ${1:tactic}."},
  {label: "xsos_Z", insertText: "xsos_Z ${1:tactic}."},
  {label: "zify"},
  {label: "zify_elim_let"},
  {label: "zify_iter_let", insertText: "zify_iter_let ${1:tactic}."},
  {label: "zify_iter_specs"},
  {label: "zify_op"},
  {label: "zify_saturate"}
];

let tacticCompletions = new Map<SemVer, CompletionItem[]>();

function buildTacticSnippets(version: SemVer): CompletionItem[] {
  return tacticSnippets
    .filter((item) => checkVersion(version, item))
    .map((item) => snippetSentence(version, item));
}

export function getTacticCompletions(prefix: string, version: SemVer): CompletionList | CompletionItem[] {
  if(prefix === "")
    return [];

  if (!tacticCompletions.has(version)) {
    tacticCompletions.set(version, buildTacticSnippets(version));
  }

  return tacticCompletions.get(version);
}
