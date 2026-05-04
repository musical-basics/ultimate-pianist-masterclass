import styles from "./placeholders.module.css";

export type QuizProps = {
  question: string;
  options: string[];
  answer: number;
};

export function Quiz({ question, options, answer }: QuizProps) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.label}>Quiz</span>
      <p className={styles.quizQuestion}>{question}</p>
      <ol className={styles.quizOptions}>
        {options.map((option, index) => (
          <li key={index}>
            {option}
            {index === answer && (
              <span className={styles.correctTag}>correct</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
