export type TerminalKind = 'log' | 'monitor' | 'capture'

// Идентификатор нужен, чтобы клиент и сервер говорили об одном и том же вопросе.
export interface TaskQuestion {
  id: string
  text: string
  options: string[]
}

export interface MonitorMetrics {
  cpu: number
  memory: number
  network?: number
}

export interface CaptureRecord {
  time: string
  source: string
  destination: string
  protocol: string
  info: string
}

export interface TaskEvent {
  terminal: number
  title: string
  timeout: number
  text?: string
  type?: TerminalKind
  metrics?: MonitorMetrics
  capture?: CaptureRecord
}

export interface TaskData {
  id: string
  title: string
  description?: string
  question: TaskQuestion
  events: TaskEvent[]
}
