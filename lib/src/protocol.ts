import { Position, Range } from 'vscode-languageserver-types';
import { RequestType, NotificationType } from 'vscode-jsonrpc';
import { SemVer } from 'semver';
import { AnnotatedText } from './AnnotatedText';


export interface Hypothesis {
  identifier: string;
  relation: string;
  expression: AnnotatedText;
}

export interface Goal {
  id: string;
  hypotheses: Hypothesis[];
  goal: AnnotatedText;
}

export interface UnfocusedGoalStack {
  // subgoals that appear before the focus
  before: Goal[];
  // reference to the more-focused background goals
  next?: UnfocusedGoalStack
  // subgoals that appear after the focus
  after: Goal[];
}

export interface ProofView {
  goals: Goal[];
  backgroundGoals?: UnfocusedGoalStack,
  shelvedGoals: Goal[],
  abandonedGoals: Goal[],
  focus: Position,
}

export interface FailValue {
  message: AnnotatedText;
  range?: Range;
  sentence: Range;
}

export interface CommandInterrupted {
  range: Range
}

export type FocusPosition = { focus: Position }
export type NotRunningTag = { type: 'not-running' }
export type NoProofTag = { type: 'no-proof' }
export type FailureTag = { type: 'failure' }
export type ProofViewTag = { type: 'proof-view' }
export type InterruptedTag = { type: 'interrupted' }
export type NoProofResult = NoProofTag
export type FailureResult = FailValue & FailureTag
export type ProofViewResult = ProofView & ProofViewTag
export type InterruptedResult = CommandInterrupted & InterruptedTag
export type BusyTag = { type: 'busy' }
export type NotRunningResult = NotRunningTag & { reason: "not-started" | "spawn-failed", coqtop?: string }
export type BusyResult = BusyTag
export type CommandResult =
  NotRunningResult |
  (BusyResult & FocusPosition) |
  (FailureResult & FocusPosition) |
  (ProofViewResult & FocusPosition) |
  (InterruptedResult & FocusPosition) |
  (NoProofResult & FocusPosition);

export enum SetDisplayOption {
  On, Off, Toggle
}
export enum DisplayOption {
  ImplicitArguments,
  Coercions,
  RawMatchingExpressions,
  Notations,
  AllBasicLowLevelContents,
  ExistentialVariableInstances,
  UniverseLevels,
  AllLowLevelContents,
}

export type RouteId = number;

export interface CoqTopParams {
  uri: string;
}

export interface CoqTopInterpretToPointParams extends CoqTopParams {
  location: number | Position,
  synchronous?: boolean,
}

export interface InterpretToEndParams extends CoqTopParams {
  synchronous?: boolean,
}

export interface LtacProfTactic {
  name: string,
  statistics: { total: number; local: number; num_calls: number; max_total: number },
  tactics: LtacProfTactic[]
}
export interface LtacProfResults {
  total_time: number,
  tactics: LtacProfTactic[]
}

export namespace InterruptCoqRequest {
  export const type = new RequestType<CoqTopParams, void, void, void>('coqtop/interrupt');
}
export namespace QuitCoqRequest {
  export const type = new RequestType<CoqTopParams, void, void, void>('coqtop/quitCoq')
}
export namespace ResetCoqRequest {
  export const type = new RequestType<CoqTopParams, void, void, void>('coqtop/resetCoq')
}
export namespace StepForwardRequest {
  export const type = new RequestType<CoqTopParams, CommandResult, void, void>('coqtop/stepForward')
}
export namespace StepBackwardRequest {
  export const type = new RequestType<CoqTopParams, CommandResult, void, void>('coqtop/stepBackward')
}
export namespace InterpretToPointRequest {
  export const type = new RequestType<CoqTopInterpretToPointParams, CommandResult, void, void>('coqtop/interpretToPoint')
}
export namespace InterpretToEndRequest {
  export const type = new RequestType<InterpretToEndParams, CommandResult, void, void>('coqtop/interpretToEnd')
}
export namespace GoalRequest {
  export const type = new RequestType<CoqTopParams, CommandResult, void, void>('coqtop/goal')
}
export interface CachedGoalParams extends CoqTopParams {
  position: Position,
  direction: "preceding" | "subsequent",
}
export namespace CachedGoalRequest {
  export const type = new RequestType<CachedGoalParams, CommandResult, void, void>('coqtop/cachedGoal')
}
export namespace FinishComputationsRequest {
  export const type = new RequestType<CoqTopParams, void, void, void>('coqtop/finishComputations')
}
export namespace QueryRequest {
  export const type = new RequestType<CoqTopQueryParams, void, void, void>('coqtop/query')
}
export type QueryFunction = "locate" | "check" | "print" | "search" | "about" | "searchAbout";
export interface CoqTopQueryParams extends CoqTopParams {
  queryFunction: QueryFunction;
  query: string;
  routeId: RouteId;
}
export interface CoqTopResizeWindowParams extends CoqTopParams {
  columns: number;
}
export namespace ResizeWindowRequest {
  export const type = new RequestType<CoqTopResizeWindowParams, void, void, void>('coqtop/resizeWindow')
}

export interface CoqTopSetDisplayOptionsParams extends CoqTopParams {
  options: { item: DisplayOption, value: SetDisplayOption }[]
}
export namespace SetDisplayOptionsRequest {
  export const type = new RequestType<CoqTopSetDisplayOptionsParams, void, void, void>('coqtop/setDisplayOptions')
}

export interface CoqTopLtacProfResultsParams extends CoqTopParams {
  offset?: number;
}
export namespace LtacProfResultsRequest {
  export const type = new RequestType<CoqTopLtacProfResultsParams, void, void, void>('coqtop/ltacProfResults')
}

export namespace GetSentencePrefixTextRequest {
  export const type = new RequestType<DocumentPositionParams, string, void, void>('coqtop/getSentencePrefixText')
}

export namespace GetCoqVersion {
  export const type = new RequestType<CoqTopParams, SemVer, void, void>('coqtop/getCoqVersion')
}

export enum HighlightType {
  StateError = 0, Parsing = 1, Processing = 2, Incomplete = 3, Processed = 4, Axiom = 5
}

export interface NotificationParams {
  uri: string;
}

export interface Highlights {
  ranges: [Range[], Range[], Range[], Range[], Range[], Range[]];
}

export type NotifyHighlightParams = NotificationParams & Highlights;

export namespace UpdateHighlightsNotification {
  export const type = new NotificationType<NotifyHighlightParams, void>('coqtop/updateHighlights')
}

export interface NotifyMessageParams extends NotificationParams {
  level: string;
  message: AnnotatedText;
  routeId: RouteId;
}
export namespace CoqMessageNotification {
  export const type = new NotificationType<NotifyMessageParams, void>('coqtop/message')
}

export namespace CoqResetNotification {
  export const type = new NotificationType<NotificationParams, void>('coqtop/wasReset')
}

export namespace CoqtopStartNotification {
  export const type = new NotificationType<NotificationParams, void>('coqtop/coqtopStarted')
}

export enum CoqtopStopReason { UserRequest, Anomaly, InternalError }
export interface NotifyCoqtopStopParams extends NotificationParams {
  reason: CoqtopStopReason;
  message?: string;
}
export namespace CoqtopStopNotification {
  export const type = new NotificationType<NotifyCoqtopStopParams, void>('coqtop/coqtopStopped')
}

export interface DocumentPositionParams extends NotificationParams {
  position: Position;
}

export namespace CoqStmFocusNotification {
  export const type = new NotificationType<DocumentPositionParams, void>('coqtop/stmFocus')
}

export enum ComputingStatus { Finished, Computing, Interrupted }

export interface NotifyLtacProfResultsParams extends NotificationParams {
  results: LtacProfResults
}

export namespace CoqLtacProfResultsNotification {
  export const type = new NotificationType<NotifyLtacProfResultsParams, void>('coqtop/ltacProfResults')
}
