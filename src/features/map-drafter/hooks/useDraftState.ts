import { useState, useEffect, useCallback, useRef } from 'react'
import type { DraftState } from '@map-drafter/types'
import { supabase } from '@/common/supabase'

// Each draft room is a single row in the `drafts` table keyed by roomId.
// All clients subscribe to the same Realtime channel for that room and
// receive Postgres changes whenever the row is updated.

export function useDraftState(roomId: string | null) {
  const [state, setState] = useState<DraftState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Fetch initial state and subscribe to real-time updates
  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchInitial() {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('drafts')
        .select('state')
        .eq('room_id', roomId)
        .single()

      if (cancelled) return
      if (err && err.code !== 'PGRST116') {
        // PGRST116 = row not found, which is fine on first load
        setError(err.message)
      } else if (data) {
        setState(data.state as DraftState)
      }
      setLoading(false)
    }

    fetchInitial()

    // Subscribe to changes on this specific room row
    const channel = supabase
      .channel(`draft:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drafts',
          filter: `room_id=eq.${roomId}`,
        },
        payload => {
          if (cancelled) return
          const row = payload.new as { state: DraftState } | null
          if (row && row.state) setState(row.state)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [roomId])

  // Upsert the full state object to Supabase
  const update = useCallback(async (next: DraftState) => {
    setState(next) // optimistic local update
    const { error: err } = await supabase
      .from('drafts')
      .upsert({ room_id: next.roomId, state: next }, { onConflict: 'room_id' })
    if (err) setError(err.message)
  }, [])

  // Create a brand new room row with the initial state
  const create = useCallback(async (initial: DraftState) => {
    setState(initial)
    const { error: err } = await supabase
      .from('drafts')
      .insert({ room_id: initial.roomId, state: initial })
    if (err) setError(err.message)
  }, [])

  return { state, loading, error, update, create }
}
