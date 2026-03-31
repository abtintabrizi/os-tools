export type Side = 'blue' | 'red' | 'spectator'
export type ActionType = 'ban' | 'pick'
export type Team = 'A' | 'B' // A = blue, B = red
export type Page = 'setup' | 'lobby' | 'pick' | 'draft'

export interface DraftAction {
  map: string
  team: Team
  action: ActionType
}

export interface SequenceStep {
  team: Team
  action: ActionType
}

export interface DraftState {
  roomId: string
  blueName: string
  redName: string
  maps: string[]
  step: number
  actions: DraftAction[]
  done: boolean
}

export type MapStatus =
  | 'available'
  | 'banned'
  | 'picked-g1'
  | 'picked-g2'
  | 'picked-g3'
