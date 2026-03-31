import { useState } from 'react'
import type { DraftState, Side } from '@/types'
import styles from '@/components/LobbyPage.module.css'

interface Props {
  state: DraftState
  onEnter: (side: Side) => void
}

function buildUrl(roomId: string, side: Side): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('room', roomId)
  url.searchParams.set('side', side)
  return url.toString()
}

export default function LobbyPage({ state, onEnter }: Props) {
  const [copied, setCopied] = useState<Side | null>(null)

  const blueUrl = buildUrl(state.roomId, 'blue')
  const redUrl = buildUrl(state.roomId, 'red')

  async function copy(url: string, side: Side) {
    await navigator.clipboard.writeText(url)
    setCopied(side)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.logo}>Omega Strikers</div>
        <h2 className={styles.title}>Room ready</h2>
        <p className={styles.sub}>// Room {state.roomId} · Share links below</p>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Share with teams</div>

          <div className={styles.linkRow}>
            <div className={styles.linkLabel + ' ' + styles.blue}>{state.blueName} — Blue side</div>
            <div className={styles.urlBox}>{blueUrl}</div>
            <button
              className={`${styles.copyBtn} ${styles.blueBtn}`}
              onClick={() => copy(blueUrl, 'blue')}
            >
              {copied === 'blue' ? 'Copied!' : 'Copy blue link'}
            </button>
          </div>

          <div className={styles.divider} />

          <div className={styles.linkRow}>
            <div className={styles.linkLabel + ' ' + styles.red}>{state.redName} — Red side</div>
            <div className={styles.urlBox}>{redUrl}</div>
            <button
              className={`${styles.copyBtn} ${styles.redBtn}`}
              onClick={() => copy(redUrl, 'red')}
            >
              {copied === 'red' ? 'Copied!' : 'Copy red link'}
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>You are the organiser — enter as:</div>
          <div className={styles.enterRow}>
            <button className={`${styles.enterBtn} ${styles.blueBtn}`} onClick={() => onEnter('blue')}>
              Enter as {state.blueName}
            </button>
            <button className={`${styles.enterBtn} ${styles.redBtn}`} onClick={() => onEnter('red')}>
              Enter as {state.redName}
            </button>
            <button className={styles.enterBtn} onClick={() => onEnter('spectator')}>
              Spectate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
