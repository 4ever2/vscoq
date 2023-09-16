'use strict';

export interface DocumentFilter {
  language?: string,
  pattern?: string,
  scheme?: string,
}
export type DocumentSelector = string | DocumentFilter | (string | DocumentFilter)[];

export interface Substitution {
	ugly: string;        // regular expression describing the text to replace
	pretty: string;      // plain-text symbol to show instead
	pre?: string;        // regular expression guard on text before "ugly"
	post?: string;       // regular expression guard on text after "ugly"
	style?: any;         // stylings to apply to the "pretty" text, if specified, or else the ugly text
}

/** The substitution settings for a language (or group of languages) */
export interface LanguageEntry {
  /** language(s) to apply these substitutions on */
  language:  DocumentSelector;
  /** substitution rules */
  substitutions: Substitution[];
}

export interface PrettifySymbolsModeSettings {
  substitutions: LanguageEntry[],
}

export interface ProofViewDiffSettings {
  enabled: string,
  addedTextIsItalic : boolean,
  removedTextIsStrikedthrough : boolean,
}

export interface AutoFormattingSettings {
  enable: boolean, // mast switch
  indentAfterBullet: "none" | "indent" | "align",
  indentAfterOpenProof: boolean,
  unindentOnCloseProof: boolean,
}

export interface CoqTopSettings {
  /** Path to coqc and coqtop binaries. @default `""` */
  binPath: string;
  /** Name of coqtop binary. @default `"coqtop"` */
  coqtopExe: string;
  /** Name of coqidetop binary. @default `"coqidetop.opt"` */
  coqidetopExe: string;
  /** A list of arguments to send to coqtop. @default `[]` */
  args: string[];
  /** When should an instance of coqtop be started for a Coq script */
  startOn: "open-script" | "interaction",
}

export interface CoqSettings {
  /** Load settings from _CoqProject (if found at the root of the Code project). @default `true` */
  loadCoqProject: boolean,
  /** The path of the coq project relative to the workspace root. Also determines where to look for the `_CoqProject` file. */
  coqProjectRoot: string,
  /** Move the editor's cursor position as Coq interactively steps forward/backward a command. @default `true` */
  moveCursorToFocus : boolean,
  /** Interpret to end of sentence */
  interpretToEndOfSentence: boolean,
  /** Auto-reveal proof-state at cursor */
  autoRevealProofStateAtCursor: boolean,
  /** Reveal the preceding or subsequent proof state w.r.t. a position */
  revealProofStateAtCursorDirection: "preceding" | "subsequent"
  /** Command to view a uri in an external browser */
  externalViewUrlCommand: string,
  /** How to host external proof-views */
  externalViewScheme: "file" | "http",
  format: AutoFormattingSettings,
  /** When to createa proof view for a script: when the script is opened, on first interaction, or else manually */
  showProofViewOn: "open-script" | "first-interaction" | "manual",
  /** Misc. diagnostic options */
  diagnostics?: {
    /** After each document edit, check for inconsistencies between the STM, sentences, and document. */
    checkTextSynchronization?: boolean,
    /** After each command, check sentence-states for inconsistencies */
    checkSentenceStateConsistency?: boolean,
  },
  /** function used by hover provider to get info on identifier */
  hoverFunction: "about" | "check",
  /** Enable/Disable proof view diff render */
  proofViewDiff?: ProofViewDiffSettings;
}

// The settings interface describe the server relevant settings part
export interface Settings {
  coqtop: CoqTopSettings,
  coq: CoqSettings,
  prettifySymbolsMode?: PrettifySymbolsModeSettings,
}

export interface SettingsState {
  fontFamily?: string,
  fontSize?: string,
  fontWeight?: string,
  prettifySymbolsMode?: boolean,
  proofViewDiff?: ProofViewDiffSettings,
}
