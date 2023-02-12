import {CompletionItem, CompletionItemKind, InsertTextFormat, CompletionList} from 'vscode-languageserver';
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

  //if (item.deprecatredIn && satisfies(version, ">= " + item.deprecatredIn))
  result.deprecated = true;


  return result;
}

function checkVersion(version : SemVer, item : TriggerSnippet) : boolean {
  if (version.version == "0.0.0")
    return true;

  if (item.addedIn && satisfies(version, "< " + item.addedIn))
    return false;

  if (item.removedIn && satisfies(version, ">= " + item.removedIn))
    return false;

  return true;
}


const optionsSnippetsRaw : TriggerSnippet[] = [
  {label: "Asymmetric Patterns"},
  {label: "Atomic Load"},
  {label: "Automatic Coercions Import"},
  {label: "Automatic Introduction"},
  {label: "Boolean Equality Schemes"},
  {label: "Bracketing Last Introduction Pattern"},
  {label: "Case Analysis Schemes"},
  {label: "Compat Notations"},
  {label: "Congruence Depth"},
  {label: "Congruence Verbose"},
  {label: "Contextual Implicit"},
  {label: "Debug Auto"},
  {label: "Debug Eauto"},
  {label: "Debug RAKAM"},
  {label: "Debug Tactic Unification"},
  {label: "Debug Trivial"},
  {label: "Debug Unification"},
  {label: "Decidable Equality Schemes"},
  {label: "Default Clearing Used Hypotheses"},
  {label: "Dependent Propositions Elimination"},
  {label: "Discriminate Introduction"},
  {label: "Dump Bytecode"},
  {label: "Elimination Schemes"},
  {label: "Equality Scheme"},
  {label: "Extraction AutoInline"},
  {label: "Extraction Conservative Types"},
  {label: "Extraction KeepSingleton"},
  {label: "Extraction Optimize"},
  {label: "Extraction SafeImplicits"},
  {label: "Extraction TypeExpand"},
  {label: "Hide Obligations"},
  {label: "Implicit Arguments"},
  {label: "Info Auto"},
  {label: "Info Eauto"},
  {label: "Info Trivial"},
  {label: "Injection L2R Pattern Order"},
  {label: "Injection On Proofs"},
  {label: "Intuition Iff Unfolding"},
  {label: "Intuition Negation Unfolding"},
  {label: "Kernel Term Sharing"},
  {label: "Keyed Unification"},
  {label: "Maximal Implicit Insertion"},
  {label: "Nonrecursive Elimination Schemes"},
  {label: "Parsing Explicit"},
  {label: "Primitive Projections"},
  {label: "Printing All"},
  {label: "Printing Coercions"},
  {label: "Printing Existential Instances"},
  {label: "Printing Implicit"},
  {label: "Printing Implicit Defensive"},
  {label: "Printing Matching"},
  {label: "Printing Notations"},
  {label: "Printing Primitive Projection Compatibility"},
  {label: "Printing Primitive Projection Parameters"},
  {label: "Printing Projections"},
  {label: "Printing Records"},
  {label: "Printing Synth"},
  {label: "Printing Universes"},
  {label: "Printing Wildcard"},
  {label: "Program Mode"},
  {label: "Proof Using Clear Unused"},
  {label: "Record Elimination Schemes"},
  {label: "Regular Subst Tactic"},
  {label: "Reversible Pattern Implicit"},
  {label: "Rewriting Schemes"},
  {label: "Short Module Printing"},
  {label: "Shrink Obligations"},
  {label: "SimplIsCbn"},
  {label: "Standard Proposition Elimination Names"},
  {label: "Strict Implicit"},
  {label: "Strict Proofs"},
  {label: "Strict Universe Declaration"},
  {label: "Strongly Strict Implicit"},
  {label: "Suggest Proof Using"},
  {label: "Tactic Compat Context"},
  {label: "Tactic Evars Pattern Unification"},
  {label: "Transparent Obligations"},
  {label: "Typeclass Resolution After Apply"},
  {label: "Typeclass Resolution For Conversion"},
  {label: "Typeclasses Debug"},
  {label: "Typeclasses Dependency Order"},
  {label: "Typeclasses Modulo Eta"},
  {label: "Typeclasses Strict Resolution"},
  {label: "Typeclasses Unique Instances"},
  {label: "Typeclasses Unique Solutions"},
  {label: "Universal Lemma Under Conjunction"},
  {label: "Universe Minimization ToSet"},
  {label: "Universe Polymorphism"},
  {label: "Verbose Compat Notations"},
];

const optionsSnippets : TriggerSnippet[] = [
  ...optionsSnippetsRaw,
  {label: "Bullet Behavior"},
  {label: "Default Goal Selector"},
  {label: "Default Proof Mode"},
  {label: "Default Proof Using"},
  {label: "Default Timeout"},
  {label: "Extraction File Comment"},
  {label: "Extraction Flag"},
  {label: "Firstorder Depth"},
  {label: "Hyps Limit"},
  {label: "Info Level"},
  {label: "Inline Level"},
  {label: "Loose Hint Behavior"},
  {label: "Printing Depth"},
  {label: "Printing Width"},
  {label: "Typeclasses Depth"},
];

const setOptionsSnippets : TriggerSnippet[] = [
  ...optionsSnippetsRaw,
  {label: "Bullet Behavior", insertText: "Bullet Behavior \"${1|None,Strict Subproofs|}\"."},
  {label: "Default Goal Selector", insertText: "Default Goal Selector \"${1:selector}\"."},
  {label: "Default Proof Mode", insertText: "Default Proof Mode \"${1|Classic,Noedit,Ltac2|}\"."},
  {label: "Default Proof Using", insertText: "Default Proof Using \"${1:section_var_expr}\"."},
  {label: "Default Timeout", insertText: "Default Timeout ${1:num}."},
  {label: "Extraction File Comment", insertText: "Extraction File Comment \"${1:string}\"."},
  {label: "Extraction Flag", insertText: "Extraction Flag ${1:num}."},
  {label: "Firstorder Depth", insertText: "Firstorder Depth ${1:num}."},
  {label: "Hyps Limit", insertText: "Hyps Limit ${1:num}."},
  {label: "Info Level", insertText: "Info Level ${1:num}."},
  {label: "Inline Level", insertText: "Inline Level ${1:num}."},
  {label: "Loose Hint Behavior", insertText: "Loose Hint Behavior \"${1|Lax,Warn,Strict|}\"."},
  {label: "Printing Depth", insertText: "Printing Depth ${1:num}."},
  {label: "Printing Width", insertText: "Printing Width ${1:num}."},
  {label: "Typeclasses Depth", insertText: "Typeclasses Depth ${1:num}."},
];

const printSnippets : TriggerSnippet[] = [
  {label: "All"},
  {label: "All Dependencies", insertText: "All Dependencies ${1:qualid}."},
  {label: "Assumptions", insertText: "Assumptions ${1:qualid}."},
  {label: "Canonical Projections"},
  {label: "Classes"},
  {label: "Coercion Paths", insertText: "Coercion Paths ${1:class1} ${2:class2}."},
  {label: "Coercions"},
  {label: "Extraction Inline"},
  {label: "Fields"},
  {label: "Grammar", insertText: "Grammar ${1|constr,pattern|}."},
  {label: "Graph"},
  {label: "Hint", insertText: "Hint ${1:ident}."},
  {label: "Hint *"},
  {label: "HintDb", insertText: "HintDb ${1:ident}."},
  {label: "Implicit", insertText: "Implicit ${1:qualid}."},
  {label: "Libraries"},
  {label: "LoadPath"},
  {label: "Ltac", insertText: "Ltac ${1:qualid}."},
  {label: "ML Modules"},
  {label: "ML Path"},
  {label: "Module", insertText: "Module ${1:ident}."},
  {label: "Module Type", insertText: "Module Type ${1:ident}."},
  {label: "Opaque Dependencies", insertText: "Opaque Dependencies ${1:qualid}."},
  {label: "Options"},
  {label: "Rings"},
  {label: "Scope", insertText: "Scope ${1:scope}."},
  {label: "Scopes"},
  {label: "Section", insertText: "Section ${1:ident}."},
  {label: "Sorted Universes"},
  {label: "Sorted Universes (filename)", insertText: "Sorted Universes \"${1:filename}\"."},
  {label: "Strategies"},
  {label: "Strategy", insertText: "Strategy ${1:qualid}."},
  {label: "Table", insertText: "Table ${1|Printing If,Printing Let|}."},
  {label: "Tables"},
  {label: "Term", insertText: "Term ${1:qualid}."},
  {label: "Transparent Dependencies", insertText: "Transparent Dependencies ${1:qualid}."},
  {label: "Universes"},
  {label: "Universes (filename)", insertText: "Universes \"${1:filename}\"."},
  {label: "Visibility"},
];

const showSnippets : TriggerSnippet[] = [
  {label: "(num)", insertText: "${1:num}.", documentation: "Displays only the num-th subgoal"},
  {label: "Conjecturest"},
  {label: "Existentials"},
  {label: "Intro"},
  {label: "Intros"},
  {label: "Proof"},
  {label: "Script"},
  {label: "Universes"},
];

const hintSnippets : TriggerSnippet[] = [
  {label: "(definition)", insertText: "${1:definition} : ${2:idents …}."},
  {label: "Constructors", insertText: "Constructors ${1:idents …} : ${2:idents …}."},
  {label: 'Cut', insertText: 'Cut "${1:regexp}" : ${2:idents …}.'},
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
];


function buildTriggerSnippets(version : SemVer) : TriggerSnippet[] {
  const _setOptionsSnippets = setOptionsSnippets
    .filter((item) => checkVersion(version, item))
    .map((item) => snippetSentence(version, item));
  const _optionsSnippets = optionsSnippets
    .filter((item) => checkVersion(version, item))
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
  {label: "Set...", insertText: "Set ", completion: _setOptionsSnippets, detail: "Set coqtop options"},
  {label: "Unset...", insertText: "Unset ", completion: _optionsSnippets, detail: "Unset coqtop options"},
  {label: "Local Set...", insertText: "Local Set ", completion: _setOptionsSnippets},
  {label: "Global Unset...", insertText: "Global Unset ", completion: _optionsSnippets},
  {label: "Test...", insertText: "Test ", completion: _optionsSnippets},
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
  const snippets = triggerSnippets.get(version.version);
  return RegExp(`\\s*(?:${snippets.map((v) => "(" + escapeRegExp(v.insertText) + ")").join('|')})\\s*$`);
}

let triggerRegexp = new Map<string, RegExp>();
let triggerSnippets = new Map<string, TriggerSnippet[]>();

function getTriggerSnippet(str: string, version : SemVer) : TriggerSnippet|null {
  const match = triggerRegexp.get(version.version).exec(str);
  if(match && match.length > 1) {
    match.shift();
    const triggerIdx = match.findIndex((v) => v!==undefined)
    return triggerSnippets.get(version.version)[triggerIdx];
  } else
    return null;
}

function getTriggerCompletions(prefix: string, version : SemVer) {
  const triggerCompletions = CompletionList.create(
    triggerSnippets.get(version.version)
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

  if (!triggerSnippets.has(version.version)) {
    triggerSnippets.set(version.version, buildTriggerSnippets(version));
    triggerRegexp.set(version.version, buildTriggerRegexp(version));
  }
  
  const trigger = getTriggerSnippet(prefix, version);
  if(trigger)
    return trigger.completion;
  else
    return getTriggerCompletions(prefix.trim(), version);
}
