'use client'

import React from 'react'
import Link from 'next/link'
import { Header } from '../components/Header/Header'
import { TaskListItem } from '../types/task'
import styles from './page.module.css'

// Фиксированные задачи для стартовой страницы
const availableTasks: TaskListItem[] = [
  {
    id: '1',
    title: 'Обнаружение атаки Brute Force',
    description: 'Научитесь выявлять и анализировать попытки подбора паролей. Изучите логи аутентификации и определите признаки брутфорс-атаки на сервер.',
    difficulty: 'easy',
    category: 'bruteforce',
  },
  {
    id: '2',
    title: 'Защита от DDoS-атаки',
    description: 'Отработайте навыки обнаружения и противодействия распределённым атакам типа "отказ в обслуживании". Проанализируйте сетевой трафик и примите меры защиты.',
    difficulty: 'easy',
    category: 'ddos',
  },
  {
    id: '3',
    title: 'Обнаружение утечки данных',
    description: 'Анализируйте сетевую и системную активность, чтобы определить факт и степень утечки конфиденциальных данных.',
    difficulty: 'medium',
    category: 'other',
  },
]

const difficultyLabels: Record<TaskListItem['difficulty'], string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
}

const categoryLabels: Record<TaskListItem['category'], string> = {
  bruteforce: 'Brute Force',
  ddos: 'DDoS',
  malware: 'Вредоносное ПО',
  phishing: 'Фишинг',
  other: 'Другое',
}

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Доступные сценарии</h1>
          <p className={styles.subtitle}>
            Выберите задачу для отработки навыков кибербезопасности
          </p>
        </div>

        <div className={styles.tasksGrid}>
          {availableTasks.map((task) => (
            <Link key={task.id} href={`/task/${task.id}`} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <h2 className={styles.taskTitle}>{task.title}</h2>
                <div className={styles.taskBadges}>
                  <span className={`${styles.badge} ${styles.badgeDifficulty}`}>
                    {difficultyLabels[task.difficulty]}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeCategory}`}>
                    {categoryLabels[task.category]}
                  </span>
                </div>
              </div>
              <p className={styles.taskDescription}>{task.description}</p>
              <div className={styles.taskFooter}>
                <span className={styles.taskLink}>Начать задачу →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
