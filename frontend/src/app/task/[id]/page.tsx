'use client'

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '../../../components/Header/Header'
import { TerminalTabs } from '../../../components/Task/TerminalTabs'
import { QuestionPanel } from '../../../components/Task/QuestionPanel'
import styles from './page.module.css'
import { useTaskStore } from '../../../stores/StoreProvider'

export default function TaskPage() {
  const params = useParams<{ id: string | string[] }>()
  const normalizedId = Array.isArray(params?.id) ? params.id[0] : params?.id

  const {
    title,
    description,
    terminals,
    terminalLogs,
    terminalTypes,
    monitorValues,
    captureValues,
    terminalTitles,
    question,
    loading,
    error,
    selectedOption,
    submissionStatus,
    loadTask,
    selectOption,
    submitAnswer,
    resetTask,
    isStreamActive,
    gameStatus,
    gameMessage,
  } = useTaskStore()

  useEffect(() => {
    void loadTask(normalizedId, '')
  }, [normalizedId, loadTask])

  useEffect(() => {
    return () => {
      resetTask()
    }
  }, [resetTask])

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.layout}>
        <section className={styles.leftPane} aria-label="Журналы и терминалы">
          <div className={styles.taskInfo}>
            <div>
              <h1 className={styles.taskTitle}>{title}</h1>
              {description && <p className={styles.taskDescription}>{description}</p>}
            </div>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <TerminalTabs
            terminals={terminals}
            logs={terminalLogs}
            types={terminalTypes}
            monitorValues={monitorValues}
            captureValues={captureValues}
            titles={terminalTitles}
            loading={loading}
          />
        </section>

        <section className={styles.rightPane} aria-label="Вопрос тренажёра">
          {question && !isStreamActive && gameStatus === 'in_progress' ? (
            <QuestionPanel
              question={question}
              selectedOption={selectedOption}
              onSelectOption={selectOption}
              onSubmit={submitAnswer}
              statusMessage={submissionStatus}
            />
          ) : (
            <div className={styles.placeholderCard}>
              <div className={styles.placeholderMessage}>
                <span>
                  {gameStatus === 'win'
                    ? 'Сценарий завершён успешно!'
                    : gameStatus === 'lose'
                      ? 'Сценарий завершён неудачно.'
                    : isStreamActive
                    ? 'Дождитесь завершения потока событий и оцените новую ситуацию.'
                    : loading
                      ? 'Загрузка вопроса…'
                      : 'Вопрос не найден для данной задачи.'}
                </span>
                {(gameMessage || submissionStatus) && (
                  <span className={styles.placeholderStatus}>{gameMessage ?? submissionStatus}</span>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {gameStatus !== 'in_progress' && (
        <div className={styles.resultOverlay} role="alert">
          <div
            className={`${styles.resultCard} ${
              gameStatus === 'win' ? styles.resultCardWin : styles.resultCardLose
            }`}
          >
            <h2 className={styles.resultTitle}>{gameStatus === 'win' ? 'Победа!' : 'Поражение'}</h2>
            <p className={styles.resultSubtitle}>
              {gameMessage ??
                (gameStatus === 'win'
                  ? 'Вы успешно справились с инцидентом.'
                  : 'Сценарий завершён. Попробуйте разобрать ошибки и повторить.')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
