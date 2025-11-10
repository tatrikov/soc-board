'use client'

import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../stores/StoreProvider'
import { Button } from '../Button/Button'
import styles from './Header.module.css'

export const Header: React.FC = () => {
  const { currentTheme, toggleTheme } = useThemeStore()

  const isLightTheme = currentTheme === 'light'

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.appName}>SOC Trainer</span>
        <span className={styles.subtitle}>Практические сценарии кибербезопасности</span>
      </div>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          icon={isLightTheme ? Moon : Sun}
          onClick={toggleTheme}
          className={styles.themeButton}
        >
          {isLightTheme ? 'Тёмная тема' : 'Светлая тема'}
        </Button>
      </div>
    </header>
  )
}

