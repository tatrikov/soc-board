import { ThemeStore } from './themeStore'
import { TaskStore } from './taskStore'

export class RootStore {
  readonly themeStore: ThemeStore
  readonly taskStore: TaskStore

  constructor() {
    this.themeStore = new ThemeStore()
    this.taskStore = new TaskStore()
  }
}

