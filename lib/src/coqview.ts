import { CommandResult } from "./protocol";
import { SettingsState } from "./settings";


export interface ResizeEvent {
  columns: number;
}

export interface ControllerEvent {
  eventName: string;
  params: ResizeEvent // | | | | | ;
}

interface GoalUpdate {
  command: 'goal-update',
  goal: CommandResult
}

interface SettingsUpdate extends SettingsState {
  command: 'settings-update'
}

export type ProofViewProtocol = GoalUpdate | SettingsUpdate;
