import { useNavigate } from 'react-router-dom';
import AssessmentQuiz from '../../components/assessment/AssessmentQuiz';
import styles from './AssessmentPage.module.css';

export default function AssessmentPage() {
  const navigate = useNavigate();

  function handleComplete() {
    localStorage.setItem('devlearn_assessed', '1');
    navigate('/');
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
          <h1 className={styles.title}>Skill Assessment</h1>
          <p className={styles.sub}>10 questions across Java, DSA, Spring Boot, MySQL, and AWS. Topics you already know will be advanced to EASY stage automatically.</p>
        </div>
        <AssessmentQuiz
          onComplete={handleComplete}
          onSkip={handleComplete}
        />
      </div>
    </div>
  );
}
