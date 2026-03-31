import { useState, useEffect } from 'react'
import type { Page, Side, DraftState } from '@/types'
import { useDraftState } from './hooks/useDraftState'
import SetupPage from '@/components/SetupPage'
import LobbyPage from '@/components/LobbyPage'
import SidePickPage from '@/components/SidePickPage'
import DraftPage from '@/components/DraftPage'
import '@/index.css'

function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    roomId: params.get('room'),
    side: params.get('side') as Side | null,
  }
}

export default function App() {
  const { roomId: urlRoom, side: urlSide } = getUrlParams()

  // If the URL already has a room+side, jump straight to draft
  const [page, setPage] = useState<Page>(() => {
    if (urlRoom && urlSide) return 'draft'
    if (urlRoom) return 'pick'
    return 'setup'
  })
  const [side, setSide] = useState<Side>(urlSide ?? 'spectator')
  const [roomId, setRoomId] = useState<string | null>(urlRoom)
  const [lobbyState, setLobbyState] = useState<DraftState | null>(null)

  const { state, loading, error, update, create } = useDraftState(roomId)

  // If someone lands on /?room=xxx with no side, show side-pick once loaded
  useEffect(() => {
    if (urlRoom && !urlSide && state && page === 'pick') {
      // stay on pick page, state is loaded
    }
  }, [state, urlRoom, urlSide, page])

  async function handleLaunch(newState: DraftState) {
    setRoomId(newState.roomId)
    setLobbyState(newState)
    await create(newState)
    setPage('lobby')
  }

  function handleSidePick(chosenSide: Side) {
    setSide(chosenSide)
    // Update URL so refreshing keeps the side
    const url = new URL(window.location.href)
    url.searchParams.set('room', roomId!)
    url.searchParams.set('side', chosenSide)
    window.history.replaceState({}, '', url.toString())
    setPage('draft')
  }

  async function handleAction(next: DraftState) {
    await update(next)
  }

  function handleReset() {
    window.history.replaceState({}, '', window.location.pathname)
    setRoomId(null)
    setLobbyState(null)
    setSide('spectator')
    setPage('setup')
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#f87171' }}>
        <strong>Supabase error:</strong> {error}
        <br /><br />
        Make sure your <code>.env</code> file is set up — see <code>SUPABASE_SETUP.md</code>.
      </div>
    )
  }

  return (
    <>
      <div className="grid-bg" />
      {page === 'setup' && (
        <SetupPage onLaunch={handleLaunch} />
      )}
      {page === 'lobby' && lobbyState && (
        <LobbyPage state={lobbyState} onEnter={handleSidePick} />
      )}
      {page === 'pick' && (
        loading
          ? <LoadingScreen message="Loading draft room..." />
          : state
            ? <SidePickPage state={state} onPick={handleSidePick} />
            : <ErrorScreen message="Room not found. Check your link." />
      )}
      {page === 'draft' && (
        loading
          ? <LoadingScreen message="Connecting to draft..." />
          : state
            ? <DraftPage state={state} side={side} onAction={handleAction} onReset={handleReset} />
            : <ErrorScreen message="Room not found. Check your link." />
      )}
    </>
  )
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.15em',
      color: 'var(--text-muted)', textTransform: 'uppercase'
    }}>
      {message}
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px',
      fontFamily: 'var(--font-mono)', fontSize: '13px',
      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em'
    }}>
      <span style={{ color: '#f87171' }}>{message}</span>
      <button
        onClick={() => window.location.href = window.location.pathname}
        style={{
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: '6px', color: 'var(--text-muted)', padding: '8px 16px',
          fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer'
        }}
      >
        Back to setup
      </button>
    </div>
  )
}
