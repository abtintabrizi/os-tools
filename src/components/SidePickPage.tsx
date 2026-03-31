import type { DraftState, Side } from '@/types'
import styles from '@/SidePickPage.module.css'

interface Props {
  state: DraftState
  onPick: (side: Side) => void
}

export default function SidePickPage({ state, onPick }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.title}>Who are you?</div>
      <div className={styles.cards}>
        <button className={`${styles.card} ${styles.blue}`} onClick={() => onPick('blue')}>
          <div className={styles.sideLabel}>Blue side</div>
          <div className={styles.teamName}>{state.blueName}</div>
        </button>
        <button className={`${styles.card} ${styles.red}`} onClick={() => onPick('red')}>
          <div className={styles.sideLabel}>Red side</div>
          <div className={styles.teamName}>{state.redName}</div>
        </button>
      </div>
      <button className={styles.spectate} onClick={() => onPick('spectator')}>
        Watch as spectator
      </button>
    </div>
  )
}
