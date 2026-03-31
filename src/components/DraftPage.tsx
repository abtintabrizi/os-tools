import { useState } from 'react'
import type { DraftState, Side, ActionType } from '../types'
import { SEQUENCE } from '../constants'
import { deriveMapStatuses, getDeciderMap } from '../utils'
import ConfirmModal from './ConfirmModal'
import styles from './DraftPage.module.css'

interface Props {
  state: DraftState
  side: Side
  onAction: (state: DraftState) => void
  onReset: () => void
}

export default function DraftPage({ state, side, onAction, onReset }: Props) {
  const [pending, setPending] = useState<string | null>(null)

  const { step, done, maps, actions, blueName, redName } = state
  const currentStep = !done && step < SEQUENCE.length ? SEQUENCE[step] : null
  const isMyTurn =
    currentStep !== null &&
    ((currentStep.team === 'A' && side === 'blue') ||
      (currentStep.team === 'B' && side === 'red'))

  const mapStatuses = deriveMapStatuses(state)
  const decider = getDeciderMap(state)

  const bans = { A: actions.find(a => a.action === 'ban' && a.team === 'A'), B: actions.find(a => a.action === 'ban' && a.team === 'B') }
  const picks = actions.filter(a => a.action === 'pick')

  function handleMapClick(map: string) {
    if (!isMyTurn || mapStatuses[map] !== 'available') return
    setPending(map)
  }

  function handleConfirm() {
    if (!pending || !currentStep) return
    const next: DraftState = {
      ...state,
      actions: [...state.actions, { map: pending, team: currentStep.team, action: currentStep.action }],
      step: state.step + 1,
      done: state.step + 1 >= SEQUENCE.length,
    }
    onAction(next)
    setPending(null)
  }

  function sideLabel(s: Side) {
    if (s === 'blue') return blueName
    if (s === 'red') return redName
    return 'Spectating'
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerSide}>
          <span className={`${styles.sideBadge} ${styles[side]}`}>
            {side === 'spectator' ? 'Spectator' : side === 'blue' ? 'Blue' : 'Red'}
          </span>
          <span className={styles.headerName}>{sideLabel(side)}</span>
        </div>

        <StepTracker step={step} done={done} />

        <div className={styles.headerRight}>
          <span className={styles.vsText}>{blueName} vs {redName}</span>
          <button className={styles.resetBtn} onClick={onReset}>Reset</button>
        </div>
      </header>

      {/* Status bar */}
      <div className={styles.statusBar}>
        {done ? (
          <>
            <span className={styles.statusText}>Draft complete</span>
            <span className={`${styles.statusBadge} ${styles.statusDone}`}>Done</span>
          </>
        ) : currentStep ? (
          <>
            <span className={styles.statusText}>
              <strong>{currentStep.team === 'A' ? blueName : redName}</strong>
              {isMyTurn ? ' — your turn' : ' is choosing'}
            </span>
            <span className={`${styles.statusBadge} ${styles['status_' + currentStep.action]}`}>
              {currentStep.action.toUpperCase()}
            </span>
          </>
        ) : null}
      </div>

      {/* Main body */}
      <div className={styles.body}>
        {/* Blue sidebar */}
        <aside className={styles.panel}>
          <div className={`${styles.panelTeam} ${styles.panelBlue}`}>{blueName}</div>
          <div className={styles.panelLabel}>Ban</div>
          <ResultSlot map={bans.A?.map} type="ban" label="Ban 1" />
          <div className={styles.panelLabel}>Pick</div>
          <ResultSlot map={picks[0]?.map} type="pick" label="Game 1" />
        </aside>

        {/* Center */}
        <main className={styles.center}>
          {done ? (
            <DonePanel
              g1={picks[0]?.map ?? '—'}
              g2={picks[1]?.map ?? '—'}
              g3={decider ?? '—'}
              blueName={blueName}
              redName={redName}
              onReset={onReset}
            />
          ) : (
            <>
              <div className={styles.poolLabel}>Map pool</div>
              <div className={styles.mapList}>
                {maps.map(map => {
                  const status = mapStatuses[map]
                  const clickable = status === 'available' && isMyTurn
                  return (
                    <button
                      key={map}
                      className={[
                        styles.mapCard,
                        styles['map_' + status],
                        clickable ? styles.mapHintActive : '',
                      ].join(' ')}
                      onClick={() => handleMapClick(map)}
                      disabled={!clickable}
                    >
                      <span className={styles.mapName}>{map}</span>
                      <span className={styles.mapStatus}>
                        {status === 'banned' ? 'Banned' :
                         status === 'picked-g1' ? 'Game 1' :
                         status === 'picked-g2' ? 'Game 2' :
                         status === 'picked-g3' ? 'Decider' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </main>

        {/* Red sidebar */}
        <aside className={`${styles.panel} ${styles.panelRight}`}>
          <div className={`${styles.panelTeam} ${styles.panelRed}`}>{redName}</div>
          <div className={styles.panelLabel}>Ban</div>
          <ResultSlot map={bans.B?.map} type="ban" label="Ban 1" />
          <div className={styles.panelLabel}>Pick</div>
          <ResultSlot map={picks[1]?.map} type="pick" label="Game 2" />
        </aside>
      </div>

      {pending && currentStep && (
        <ConfirmModal
          map={pending}
          action={currentStep.action}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}

function ResultSlot({ map, type, label }: { map?: string; type: 'ban' | 'pick'; label: string }) {
  const filled = !!map
  return (
    <div className={[styles.slot, filled ? styles['slot_' + type] : ''].join(' ')}>
      <span className={`${styles.slotIcon} ${styles['slotIcon_' + type]}`}>
        {type === 'ban' ? '✕' : '✓'}
      </span>
      <span className={styles.slotMap}>{map ?? '—'}</span>
      <span className={styles.slotLabel}>{label}</span>
    </div>
  )
}

function StepTracker({ step, done }: { step: number; done: boolean }) {
  return (
    <div className={styles.stepTracker}>
      {SEQUENCE.map((s, i) => {
        let cls = styles.pip
        if (i < step || done) cls += ' ' + (s.action === 'ban' ? styles.pipBan : styles.pipPick)
        else if (i === step && !done) cls += ' ' + styles.pipCurrent
        return <span key={i} className={cls} />
      })}
    </div>
  )
}

function DonePanel({
  g1, g2, g3, blueName, redName, onReset
}: { g1: string; g2: string; g3: string; blueName: string; redName: string; onReset: () => void }) {
  return (
    <div className={styles.donePanel}>
      <div className={styles.doneBadge}>Draft complete</div>
      <div className={`${styles.gameResult} ${styles.g1}`}>
        <div>
          <div className={styles.gameNum}>Game 1</div>
          <div className={styles.gameMap}>{g1}</div>
        </div>
        <div className={`${styles.gameTeam} ${styles.gameTeamBlue}`}>{blueName} pick</div>
      </div>
      <div className={`${styles.gameResult} ${styles.g2}`}>
        <div>
          <div className={styles.gameNum}>Game 2</div>
          <div className={styles.gameMap}>{g2}</div>
        </div>
        <div className={`${styles.gameTeam} ${styles.gameTeamRed}`}>{redName} pick</div>
      </div>
      <div className={`${styles.gameResult} ${styles.g3}`}>
        <div>
          <div className={styles.gameNum}>Game 3 (decider)</div>
          <div className={styles.gameMap}>{g3}</div>
        </div>
        <div className={`${styles.gameTeam} ${styles.gameTeamGold}`}>Decider</div>
      </div>
      <button className={styles.newDraftBtn} onClick={onReset}>New draft</button>
    </div>
  )
}
