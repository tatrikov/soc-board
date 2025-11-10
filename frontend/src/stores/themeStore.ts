import { makeAutoObservable } from 'mobx'

export type Theme = 'light' | 'dark'

export class ThemeStore {
  currentTheme: Theme = 'light'
  isInitialLoad: boolean = true // флаг первой загрузки

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    if (typeof window !== 'undefined') {
      this.loadTheme()
    }
  }

  private loadTheme() {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const savedTheme = localStorage.getItem('theme') as Theme
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      if (savedTheme) {
        this.currentTheme = savedTheme
      } else if (systemPrefersDark) {
        this.currentTheme = 'dark'
      }
      
      this.applyTheme(false) // false - не анимировать при загрузке
    } catch (error) {
      console.error('Failed to load theme:', error)
    } finally {
      // После загрузки снимаем флаг первой загрузки
      setTimeout(() => {
        this.isInitialLoad = false
      }, 100)
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    this.applyTheme(true) // true - анимировать при переключении
    this.saveTheme()
  }

  setTheme(theme: Theme) {
    this.currentTheme = theme
    this.applyTheme(true) // true - анимировать при установке
    this.saveTheme()
  }

  private applyTheme(shouldAnimate: boolean = true) {
    if (typeof document === 'undefined') {
      return
    }

    const html = document.documentElement
    
    if (!shouldAnimate || this.isInitialLoad) {
      // Отключаем анимацию для первой загрузки
      html.classList.add('no-theme-transition')
    }
    
    html.setAttribute('data-theme', this.currentTheme)
    
    // Включаем анимацию после небольшой задержки
    if (!this.isInitialLoad) {
      setTimeout(() => {
        html.classList.remove('no-theme-transition')
      }, 10)
    }
  }

  private saveTheme() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', this.currentTheme)
    }
  }
}