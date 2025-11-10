'use client'

import { autorun } from 'mobx'
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { RootStore } from './rootStore'
import type { Theme } from './themeStore'

import type { TaskQuestion } from '../types/task'

const StoreContext = createContext<RootStore | null>(null)

interface StoreProviderProps {
  children: React.ReactNode
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const store = useMemo(() => new RootStore(), [])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export const useRootStore = () => {
  const store = useContext(StoreContext)

  if (!store) {
    throw new Error('useRootStore должен использоваться внутри StoreProvider')
  }

  return store
}

export const useThemeStore = () => {
  const { themeStore } = useRootStore()
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeStore.currentTheme)

  useEffect(() => {
    const dispose = autorun(() => {
      setCurrentTheme(themeStore.currentTheme)
    })

    return () => {
      dispose()
    }
  }, [themeStore])

  return {
    currentTheme,
    isInitialLoad: themeStore.isInitialLoad,
    toggleTheme: themeStore.toggleTheme,
    setTheme: themeStore.setTheme,
  }
}

export const useTaskStore = () => {
  const { taskStore } = useRootStore()
  const [snapshot, setSnapshot] = useState(() => ({
    title: taskStore.title,
    description: taskStore.description,
    question: taskStore.question,
    terminalLogs: taskStore.terminalLogs,
    terminals: taskStore.terminalsList,
    terminalTypes: taskStore.terminalTypes,
    monitorValues: taskStore.monitorValues,
    captureValues: taskStore.captureValues,
    terminalTitles: taskStore.terminalTitles,
    selectedOption: taskStore.selectedOption,
    submissionStatus: taskStore.submissionStatus,
    loading: taskStore.loading,
    error: taskStore.error,
    isStreamActive: taskStore.isStreamActive,
    gameStatus: taskStore.gameStatus,
    gameMessage: taskStore.gameMessage,
  }))

  useEffect(() => {
    const dispose = autorun(() => {
      setSnapshot({
        title: taskStore.title,
        description: taskStore.description,
        question: taskStore.question,
        terminalLogs: taskStore.terminalLogs,
        terminals: taskStore.terminalsList,
        terminalTypes: taskStore.terminalTypes,
        monitorValues: taskStore.monitorValues,
        captureValues: taskStore.captureValues,
        terminalTitles: taskStore.terminalTitles,
        selectedOption: taskStore.selectedOption,
        submissionStatus: taskStore.submissionStatus,
        loading: taskStore.loading,
        error: taskStore.error,
        isStreamActive: taskStore.isStreamActive,
        gameStatus: taskStore.gameStatus,
        gameMessage: taskStore.gameMessage,
      })
    })

    return () => {
      dispose()
    }
  }, [taskStore])

  return {
    ...snapshot,
    loadTask: taskStore.loadTask,
    selectOption: taskStore.selectOption,
    submitAnswer: taskStore.submitAnswer,
    resetTask: taskStore.resetTask,
    appendTaskUpdate: taskStore.appendTaskUpdate,
  }
}

