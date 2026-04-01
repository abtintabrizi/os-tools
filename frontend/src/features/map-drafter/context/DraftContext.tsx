import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DraftState, Side } from '@map-drafter/types'
import { useDraftApi, type CreateRoomConfig } from '@map-drafter/hooks/useDraftApi'

interface DraftContextValue {
  state: DraftState | null
  lobbyState: DraftState | null
  loading: boolean
  error: string | null
  side: Side
  roomId: string | null
  handleLaunch: (config: CreateRoomConfig) => Promise<void>
  handleSidePick: (side: Side) => void
  handleAction: (map: string) => Promise<void>
  handleReady: () => Promise<void>
  handleReset: () => void
}

const DraftContext = createContext<DraftContextValue | null>(null)

export function useDraftContext(): DraftContextValue {
  const ctx = useContext(DraftContext)
  if (!ctx) throw new Error('useDraftContext must be used inside DraftProvider')
  return ctx
}

function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    roomId: params.get('room'),
    side: params.get('side') as Side | null,
  }
}

export function DraftProvider({ children }: { children: ReactNode }) {
  const { roomId: urlRoom, side: urlSide } = getUrlParams()
  const navigate = useNavigate()

  const [side, setSide] = useState<Side>(urlSide ?? 'spectator')
  const [roomId, setRoomId] = useState<string | null>(urlRoom)
  const [lobbyState, setLobbyState] = useState<DraftState | null>(null)

  const { state, loading, error, create, applyAction, ready } = useDraftApi(roomId)

  // Redirect from base path when URL has room+side params (e.g. from a shared lobby link)
  useEffect(() => {
    const pathname = window.location.pathname
    const isBasePath = pathname === '/map-draft' || pathname === '/map-draft/'
    if (!isBasePath) return
    const search = window.location.search
    if (urlRoom && urlSide) {
      navigate(`/map-draft/draft${search}`, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLaunch(config: CreateRoomConfig) {
    const newState = await create(config)
    setLobbyState(newState)
    setRoomId(newState.roomId)
    navigate(`/map-draft/lobby?room=${newState.roomId}`)
  }

  function handleSidePick(chosenSide: Side) {
    setSide(chosenSide)
    const url = new URL(window.location.href)
    url.searchParams.set('room', roomId!)
    url.searchParams.set('side', chosenSide)
    window.history.replaceState({}, '', url.toString())
    navigate(`/map-draft/draft${url.search}`)
  }

  async function handleAction(map: string) {
    await applyAction(map)
  }

  async function handleReady() {
    if (side === 'blue' || side === 'red') {
      await ready(side)
    }
  }

  function handleReset() {
    window.history.replaceState({}, '', '/map-draft')
    setRoomId(null)
    setLobbyState(null)
    setSide('spectator')
    navigate('/map-draft')
  }

  return (
    <DraftContext.Provider
      value={{
        state,
        lobbyState,
        loading,
        error,
        side,
        roomId,
        handleLaunch,
        handleSidePick,
        handleAction,
        handleReady,
        handleReset,
      }}
    >
      {children}
    </DraftContext.Provider>
  )
}
