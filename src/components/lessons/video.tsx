import styles from "./placeholders.module.css";

export type VideoProps = {
  playbackId: string;
};

export function Video({ playbackId }: VideoProps) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.label}>Mux Video</span>
      <div className={styles.id}>{playbackId}</div>
    </div>
  );
}
