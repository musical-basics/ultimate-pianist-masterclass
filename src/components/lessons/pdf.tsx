import styles from "./placeholders.module.css";

export type PdfProps = {
  src: string;
  title?: string;
};

export function Pdf({ src, title }: PdfProps) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.label}>PDF</span>
      <div>
        <a className={styles.pdfLink} href={src} target="_blank" rel="noreferrer">
          {title ?? src}
        </a>
      </div>
    </div>
  );
}
