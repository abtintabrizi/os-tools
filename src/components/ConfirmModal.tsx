import type { ActionType } from "@/features/map-drafter/types";
import styles from "@/components/ConfirmModal.module.css";

interface Props {
  map: string;
  action: ActionType;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  map,
  action,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={styles.modal}>
        <div className={`${styles.actionLabel} ${styles[action]}`}>
          {action.toUpperCase()}
        </div>
        <div className={styles.mapName}>{map}</div>
        <div className={styles.btns}>
          <button className={styles.cancel} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`${styles.confirm} ${styles[`confirm_${action}`]}`}
            onClick={onConfirm}
          >
            {action === "ban" ? "Ban map" : "Pick map"}
          </button>
        </div>
      </div>
    </div>
  );
}
