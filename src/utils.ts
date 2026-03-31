import { DraftState, MapStatus } from "@/features/map-drafter/types"


export function deriveMapStatuses(state: DraftState): Record<string, MapStatus> {
  const statuses: Record<string, MapStatus> = {}
  state.maps.forEach(m => (statuses[m] = 'available'))

  let pickCount = 0
  state.actions.forEach(a => {
    if (a.action === 'ban') {
      statuses[a.map] = 'banned'
    } else {
      pickCount++
      statuses[a.map] = `picked-g${pickCount}` as MapStatus
    }
  })

  // Auto-assign decider when draft is done
  if (state.done) {
    const remaining = state.maps.find(m => statuses[m] === 'available')
    if (remaining) statuses[remaining] = 'picked-g3'
  }

  return statuses
}

export function getDeciderMap(state: DraftState): string | null {
  if (!state.done) return null
  const statuses = deriveMapStatuses(state)
  return state.maps.find(m => statuses[m] === 'picked-g3') ?? null
}
