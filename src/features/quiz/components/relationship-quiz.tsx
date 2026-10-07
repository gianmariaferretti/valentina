"use client";

import {
  ArrowRight,
  Award,
  Check,
  Gift,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useTransition } from "react";

import { Sticker } from "@/components/design-system";
import {
  startQuiz,
  submitQuizAnswer,
} from "@/features/quiz/actions/quiz-actions";
import type {
  QuizCompletion,
  QuizPersistentStats,
  QuizQuestionView,
} from "@/features/quiz/types";
import { RewardReveal } from "@/features/rewards/components/reward-reveal";

import styles from "./quiz.module.css";

type QuizPhase = "intro" | "question" | "result";

interface AnswerFeedback {
  readonly isCorrect: boolean;
  readonly message: string;
}

interface RelationshipQuizProps {
  readonly questions: readonly QuizQuestionView[];
  readonly initialStats: QuizPersistentStats;
}

export function RelationshipQuiz({
  questions,
  initialStats,
}: RelationshipQuizProps) {
  const reduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [completion, setCompletion] = useState<QuizCompletion | null>(null);
  const [pendingCompletion, setPendingCompletion] =
    useState<QuizCompletion | null>(null);
  const [stats, setStats] = useState(initialStats);
  const [error, setError] = useState<string | null>(null);

  const question = questions[questionIndex];
  const answeredQuestions = questionIndex + (feedback ? 1 : 0);
  const progress = (answeredQuestions / questions.length) * 100;
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await startQuiz();
      if (result.status === "error" || !result.attemptId) {
        setError(result.message);
        return;
      }

      setAttemptId(result.attemptId);
      setQuestionIndex(0);
      setScore(0);
      setSelectedAnswerId(null);
      setFeedback(null);
      setCompletion(null);
      setPendingCompletion(null);
      if (result.stats) setStats(result.stats);
      setPhase("question");
    });
  }

  function handleAnswer(answerId: string) {
    if (!attemptId || !question || feedback || isPending) return;

    setError(null);
    setSelectedAnswerId(answerId);
    startTransition(async () => {
      const result = await submitQuizAnswer({
        attemptId,
        questionId: question.id,
        answerId,
      });

      if (
        result.status === "error" ||
        typeof result.isCorrect !== "boolean" ||
        typeof result.currentScore !== "number" ||
        !result.feedback
      ) {
        setSelectedAnswerId(null);
        setAttemptId(null);
        setError(result.message);
        setPhase("intro");
        return;
      }

      setScore(result.currentScore);
      setFeedback({
        isCorrect: result.isCorrect,
        message: result.feedback,
      });

      if (result.completed && result.completion) {
        setPendingCompletion(result.completion);
      }
    });
  }

  function handleContinue() {
    if (pendingCompletion) {
      setCompletion(pendingCompletion);
      setStats({
        bestScore: pendingCompletion.bestScore,
        attempts: pendingCompletion.attempts,
        achievementUnlocked:
          stats.achievementUnlocked || Boolean(pendingCompletion.achievement),
        rewardClaimed: stats.rewardClaimed || pendingCompletion.rewardClaimed,
      });
      setPhase("result");
      return;
    }

    setQuestionIndex((current) => current + 1);
    setSelectedAnswerId(null);
    setFeedback(null);
    setError(null);
  }

  function getAnswerState(optionId: string) {
    if (!selectedAnswerId) return "idle";
    if (optionId !== selectedAnswerId) return feedback ? "muted" : "idle";
    if (!feedback) return "pending";
    return feedback.isCorrect ? "correct" : "incorrect";
  }

  return (
    <div className={styles.page}>
      <div aria-hidden="true" className={styles.backdropType}>
        V&amp;G
      </div>

      <div className={`page-container ${styles.container}`}>
        <div className={styles.masthead}>
          <p>V&amp;G Relationship Intelligence Unit</p>
          <div>
            <Sticker
              rotation={-2}
              size="sm"
              text="Girlfriend verification"
              variant="girlfriend-approved"
            />
            <Sticker
              className={styles.classifiedSticker}
              rotation={3}
              size="sm"
              text="Answers classified"
              variant="classified"
            />
          </div>
        </div>

        <AnimatePresence initial={false} mode="wait">
          {phase === "intro" ? (
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              aria-labelledby="quiz-intro-title"
              className={styles.intro}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              key="intro"
              transition={transition}
            >
              <div className={styles.introCopy}>
                <p className={styles.kicker}>The boyfriend exam · Year One</p>
                <h1 id="quiz-intro-title">
                  Do you actually know
                  <em>your boyfriend?</em>
                </h1>
                <p className={styles.introNote}>
                  Ten entirely fair questions. No witnesses. Results may be
                  entered into the permanent relationship record.
                </p>

                <button
                  className={styles.primaryButton}
                  disabled={isPending}
                  onClick={handleStart}
                  type="button"
                >
                  {isPending ? "Preparing evidence…" : "Start"}
                  <ArrowRight aria-hidden="true" size={17} />
                </button>
                <p aria-live="polite" className={styles.error}>
                  {error}
                </p>
              </div>

              <aside className={styles.introDossier}>
                <div className={styles.dossierSeal}>
                  <ShieldCheck aria-hidden="true" size={28} strokeWidth={1.4} />
                  <span>Official relationship assessment</span>
                </div>
                <dl className={styles.introFacts}>
                  <div>
                    <dt>10</dt>
                    <dd>Questions</dd>
                  </div>
                  <div>
                    <dt>1</dt>
                    <dd>Relationship</dd>
                  </div>
                  <div>
                    <dt>0</dt>
                    <dd>Pressure</dd>
                  </div>
                </dl>
                <div className={styles.savedStats}>
                  <span>Permanent record</span>
                  <p>
                    Best score <strong>{stats.bestScore}/10</strong>
                  </p>
                  <p>
                    Attempts <strong>{stats.attempts}</strong>
                  </p>
                  {stats.achievementUnlocked ? (
                    <p className={styles.earnedMark}>
                      <Award aria-hidden="true" size={14} /> Knows Too Much
                    </p>
                  ) : null}
                </div>
              </aside>
            </motion.section>
          ) : null}

          {phase === "question" && question ? (
            <motion.section
              animate={{ opacity: 1, x: 0 }}
              aria-label="Relationship quiz"
              className={styles.quiz}
              exit={reduceMotion ? undefined : { opacity: 0, x: -14 }}
              initial={reduceMotion ? false : { opacity: 0, x: 18 }}
              key={`question-${question.id}`}
              transition={transition}
            >
              <header className={styles.quizHeader}>
                <div className={styles.progressLabels}>
                  <span>
                    Question {questionIndex + 1} of {questions.length}
                  </span>
                  <span>Score {score}</span>
                </div>
                <div
                  aria-label={`${answeredQuestions} of ${questions.length} questions answered`}
                  aria-valuemax={questions.length}
                  aria-valuemin={0}
                  aria-valuenow={answeredQuestions}
                  className={styles.progressTrack}
                  role="progressbar"
                >
                  <motion.span
                    animate={{ width: `${progress}%` }}
                    initial={false}
                    transition={{ duration: reduceMotion ? 0 : 0.35 }}
                  />
                </div>
              </header>

              <div className={styles.questionLayout}>
                <aside className={styles.questionIndex} aria-hidden="true">
                  <span>{String(questionIndex + 1).padStart(2, "0")}</span>
                  <HelpCircle size={22} strokeWidth={1.4} />
                  <p>Choose carefully. Or at least confidently.</p>
                </aside>

                <section
                  aria-labelledby={`question-${question.id}`}
                  className={styles.questionCard}
                >
                  <p className={styles.questionEyebrow}>{question.eyebrow}</p>
                  <h1 id={`question-${question.id}`}>{question.prompt}</h1>

                  <div className={styles.answers}>
                    {question.options.map((option, optionIndex) => {
                      const answerState = getAnswerState(option.id);
                      return (
                        <button
                          className={styles.answer}
                          data-state={answerState}
                          disabled={isPending || Boolean(feedback)}
                          key={option.id}
                          onClick={() => handleAnswer(option.id)}
                          type="button"
                        >
                          <span className={styles.answerLetter}>
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span>{option.label}</span>
                          <span className={styles.answerIcon}>
                            {answerState === "correct" ? (
                              <Check aria-hidden="true" size={17} />
                            ) : null}
                            {answerState === "incorrect" ? (
                              <X aria-hidden="true" size={17} />
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence initial={false}>
                    {feedback ? (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        aria-live="polite"
                        className={styles.feedback}
                        data-correct={feedback.isCorrect}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        transition={transition}
                      >
                        <div>
                          {feedback.isCorrect ? (
                            <Check aria-hidden="true" size={18} />
                          ) : (
                            <X aria-hidden="true" size={18} />
                          )}
                          <p>
                            <strong>
                              {feedback.isCorrect
                                ? "Correct."
                                : "Questionable."}
                            </strong>
                            <span>{feedback.message}</span>
                          </p>
                        </div>
                        <button onClick={handleContinue} type="button">
                          {pendingCompletion ? "See results" : "Next question"}
                          <ArrowRight aria-hidden="true" size={16} />
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <p aria-live="polite" className={styles.error}>
                    {isPending ? "Checking the official answer…" : error}
                  </p>
                </section>
              </div>
            </motion.section>
          ) : null}

          {phase === "result" && completion ? (
            <motion.section
              animate={{ opacity: 1, scale: 1 }}
              aria-labelledby="quiz-result-title"
              className={styles.result}
              initial={
                reduceMotion ? false : { opacity: 0, scale: 0.985, y: 16 }
              }
              key="result"
              transition={transition}
            >
              <Sparkles aria-hidden="true" className={styles.sparkOne} />
              <Sparkles aria-hidden="true" className={styles.sparkTwo} />

              <div className={styles.resultScore}>
                <span>{completion.score}</span>
                <span>/ {completion.totalQuestions}</span>
              </div>
              <p className={styles.resultEyebrow}>Official result</p>
              <h1 id="quiz-result-title">{completion.result.title}</h1>
              <p className={styles.resultDescription}>
                “{completion.result.description}”
              </p>
              <Sticker
                rotation={-3}
                size="sm"
                text={completion.result.sticker}
                variant={completion.score >= 8 ? "girlfriend-approved" : "text"}
              />

              <div className={styles.resultStats}>
                <p>
                  Personal best <strong>{completion.bestScore}/10</strong>
                </p>
                <p>
                  Attempts <strong>{completion.attempts}</strong>
                </p>
              </div>

              {completion.achievement ? (
                <aside
                  className={styles.achievement}
                  data-new={completion.achievement.newlyGranted}
                >
                  <div>
                    <Award aria-hidden="true" size={24} strokeWidth={1.4} />
                  </div>
                  <p>
                    <span>
                      {completion.achievement.newlyGranted
                        ? "Achievement unlocked"
                        : "Achievement retained"}
                    </span>
                    <strong>{completion.achievement.title}</strong>
                    {completion.achievement.description}
                  </p>
                </aside>
              ) : null}

              {completion.reward ? (
                <div className={styles.rewardWrap}>
                  <RewardReveal reward={completion.reward} />
                </div>
              ) : completion.rewardClaimed ? (
                <p className={styles.rewardRetained}>
                  <Gift aria-hidden="true" size={17} /> Secret reward already
                  secured in the wallet.
                </p>
              ) : null}

              <button
                className={styles.retryButton}
                disabled={isPending}
                onClick={handleStart}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={16} />
                {isPending ? "Resetting evidence…" : "Try again"}
              </button>
              <p aria-live="polite" className={styles.error}>
                {error}
              </p>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
