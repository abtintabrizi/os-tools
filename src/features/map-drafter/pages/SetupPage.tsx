import { useState } from 'react'
import type { DraftState } from '@map-drafter/types'
import { ALL_MAPS } from '@/common/constants'
import styles from '@map-drafter/pages/SetupPage.module.css'

interface Props {
  onLaunch: (state: DraftState) => void
}

function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function SetupPage({ onLaunch }: Props) {
  const [blueName, setBlueName] = useState('')
  const [redName, setRedName] = useState('')
  const [enabledMaps, setEnabledMaps] = useState<Set<string>>(new Set(ALL_MAPS))
  const [loading, setLoading] = useState(false)

  function toggleMap(map: string) {
    setEnabledMaps(prev => {
      const next = new Set(prev)
      if (next.has(map)) next.delete(map)
      else next.add(map)
      return next
    })
  }

  async function handleLaunch() {
    const maps = ALL_MAPS.filter(m => enabledMaps.has(m))
    if (maps.length < 5) {
      alert('Enable at least 5 maps for a Bo3 draft.')
      return
    }
    setLoading(true)
    const state: DraftState = {
      roomId: generateRoomId(),
      blueName: blueName.trim() || 'Team A',
      redName: redName.trim() || 'Team B',
      maps,
      step: 0,
      actions: [],
      done: false,
    }
    await onLaunch(state)
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.logo}>Omega Strikers</div>
        <h1 className={styles.title}>
          Map<br /><em>Draft</em>
        </h1>
        <p className={styles.sub}>// Best of 3 · Online</p>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Teams</div>
          <div className={styles.teamsRow}>
            <div className={styles.inputWrap}>
              <span className={`${styles.badge} ${styles.blue}`}>Blue</span>
              <input
                className={styles.input}
                type="text"
                placeholder="Team A"
                maxLength={24}
                value={blueName}
                onChange={e => setBlueName(e.target.value)}
              />
            </div>
            <div className={styles.inputWrap}>
              <span className={`${styles.badge} ${styles.red}`}>Red</span>
              <input
                className={styles.input}
                type="text"
                placeholder="Team B"
                maxLength={24}
                value={redName}
                onChange={e => setRedName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Map pool — click to toggle</div>
          <div className={styles.mapsGrid}>
            {ALL_MAPS.map(map => (
              <button
                key={map}
                className={`${styles.mapToggle} ${enabledMaps.has(map) ? styles.on : ''}`}
                onClick={() => toggleMap(map)}
              >
                <span className={styles.pip} />
                {map}
              </button>
            ))}
          </div>
        </div>

        <button className={styles.launchBtn} onClick={handleLaunch} disabled={loading}>
          {loading ? 'Creating room...' : 'Create Draft Room →'}
        </button>
      </div>
    </div>
  )
}
