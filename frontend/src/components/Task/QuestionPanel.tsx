'use client'

import React from 'react'
import { Button } from '../Button/Button'
import type { TaskQuestion } from '../../types/task'
import styles from './QuestionPanel.module.css'

interface QuestionPanelProps {
  question: TaskQuestion
  selectedOption: number | null
  onSelectOption: (index: number) => void
  onSubmit: () => void
  statusMessage?: string | null
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  selectedOption,
  onSelectOption,
  onSubmit,
  statusMessage = null,
}) => {
  const handleOptionClick = (index: number) => {
    onSelectOption(index)
  }

  const submitDisabled = selectedOption === null

  return (
    // Пробрасываем идентификатор вопроса прямо в DOM — удобно, если нужно быстро подсмотреть, что за вопрос активен.
    <aside className={styles.panel} data-question-id={question.id}>
      <div className={styles.header}>
        <h2 className={styles.title}>{question.text}</h2>
      </div>

      <div className={styles.options}>
        {question.options.map((option, index) => {
          const selected = selectedOption === index
          return (
            <button
              // Ключ завязан на id вопроса, чтобы React пересобрал список, когда прилетит новый вопрос с теми же вариантами.
              key={`${question.id}-${index}`}
              type="button"
              className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
              onClick={() => handleOptionClick(index)}
              aria-pressed={selected}
            >
              <span className={styles.optionPrefix}>{index + 1}</span>
              <span className={styles.optionText}>{option}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.footer}>
        <Button
          onClick={onSubmit}
          disabled={submitDisabled}
          className={styles.submitButton}
        >
          Отправить ответ
        </Button>
        {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
      </div>
    </aside>
  )
}

