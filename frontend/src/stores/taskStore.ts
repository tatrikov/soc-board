import { makeAutoObservable } from 'mobx'
import type {
  CaptureRecord,
  MonitorMetrics,
  TaskData,
  TaskEvent,
  TaskQuestion,
  TerminalKind,
} from '../types/task'

// Вспомогательный тип для первичной загрузки задачи.
interface TaskResponse {
  id: string
  title: string
  description?: string
  question: TaskQuestion
  events: TaskEvent[]
}

// Тип, который возвращает сервер после отправки ответа или просто при обновлении событий.
interface TaskUpdateResponse {
  question?: TaskQuestion
  events?: TaskEvent[]
  message?: string
  status?: 'continue' | 'win' | 'lose'
  statusMessage?: string
}

// Основной MobX-стор, управляющий состоянием задачи и событиями терминалов.
export class TaskStore {
  // Текущее id задачи с бэкенда.
  taskId: string | null = null
  // Заголовок сценария, отображается в UI.
  title = 'Задача тренажёра'
  // Текстовое описание сценария.
  description: string | null = null
  // Текущий активный вопрос, который пользователь видит справа.
  question: TaskQuestion | null = null
  // Индекс выбранного варианта ответа пользователем.
  selectedOption: number | null = null
  // Сообщение о статусе отправки ответа (ошибки, успех и т.п.).
  submissionStatus: string | null = null
  // Флаг загрузки (включается, когда тянем данные с сервера).
  loading = false
  // Строка с текстом ошибки, если что-то пошло не так.
  error: string | null = null
  // Логи по каждому терминалу; ключ — номер терминала.
  terminalLogs: Record<number, string[]> = {}
  // Тип интерфейса для терминала (обычный лог, мониторинг, захват пакетов).
  terminalTypes: Record<number, TerminalKind> = {}
  // Значения мониторинга для терминалов, где показываем метрики.
  monitorValues: Record<number, MonitorMetrics | null> = {}
  // Список записей захвата трафика для capture-терминалов.
  captureValues: Record<number, CaptureRecord[]> = {}
  // Заголовки вкладок терминалов.
  terminalTitles: Record<number, string> = {}
  // Отметка времени, когда нужно запускать следующее событие.
  private nextEventTimestamp = Date.now()
  // Количество событий, которые уже запланированы, но ещё не проиграны.
  private pendingEvents = 0
  // Базовый URL API, сохраняем для повторных запросов.
  private apiBase?: string
  // Текущее состояние сценария (идёт, победа, поражение).
  gameStatus: 'in_progress' | 'win' | 'lose' = 'in_progress'
  // Сообщение для итогового экрана (победа/поражение).
  gameMessage: string | null = null
  // Массив идентификаторов таймеров, чтобы уметь их чистить.
  private timers: number[] = []

  constructor() {
    // makeAutoObservable автоматически делает все поля и методы реактивными.
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get terminalsList() {
    // Собираем список терминалов из ключей словаря и сортируем по возрастанию.
    return Object.keys(this.terminalLogs)
      .map((key) => Number(key))
      .sort((a, b) => a - b)
  }

  get isStreamActive() {
    // Если у нас есть незавершённые таймеры — поток событий ещё продолжается.
    return this.pendingEvents > 0
  }

  get hasQuestion() {
    // Просто проверка на наличие вопроса, часто нужна в шаблонах.
    return Boolean(this.question)
  }

  async loadTask(taskId: string | undefined, apiBase?: string) {
    // Без id задачи бессмысленно идти дальше — покажем ошибку.
    if (!taskId) {
      this.error = 'Не удалось получить id задачи'
      return
    }

    // Сбрасываем текущее состояние перед новой загрузкой.
    this.clearTimers()
    this.taskId = taskId
    this.loading = true
    this.error = null
    this.apiBase = apiBase ?? undefined
    this.title = 'Задача тренажёра'
    this.description = null
    this.question = null
    this.selectedOption = null
    this.submissionStatus = null
    this.terminalLogs = {}
    this.terminalTypes = {}
    this.monitorValues = {}
    this.captureValues = {}
    this.terminalTitles = {}
    this.nextEventTimestamp = Date.now()
    this.pendingEvents = 0
    this.gameStatus = 'in_progress'
    this.gameMessage = null

    // Если API не передали, значит работаем в демо-режиме.
    if (!apiBase) {
      this.applyTask(this.buildFallbackTask(taskId))
      this.loading = false
      return
    }

    try {
      // Тянем полные данные задачи.
      const response = await fetch(`${apiBase}/tasks/${taskId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`status ${response.status}`)
      }

      const data = (await response.json()) as TaskResponse
      this.applyTask(data)
    } catch (error) {
      // Если сервер недоступен, переключаемся на демо и сообщаем об этом.
      console.error('Ошибка загрузки задачи:', error)
      this.applyTask(this.buildFallbackTask(taskId))
      this.error = 'Не удалось загрузить данные с сервера. Показан демонстрационный сценарий.'
    } finally {
      this.loading = false
    }
  }

  selectOption(index: number) {
    // Сохраняем выбор пользователя и чистим сообщение об отправке.
    this.selectedOption = index
    this.submissionStatus = null
  }

  async submitAnswer() {
    if (this.selectedOption === null) {
      this.submissionStatus = 'Сначала выберите ответ.'
      return
    }

    if (!this.taskId) {
      this.submissionStatus = 'Нет активной задачи.'
      return
    }

    // Без вопроса не сможем сопоставить ответ на стороне сервера.
    // Такое иногда случается, если поток событий ещё идёт и новый вопрос не подгрузился.
    if (!this.question) {
      this.submissionStatus = 'Нет активного вопроса.'
      return
    }

    // Показываем, что началась отправка.
    this.submissionStatus = 'Отправляем ответ...'

    // В демо-режиме просто проигрываем заранее заготовленные события.
    if (!this.apiBase) {
      const fallback = this.buildFallbackUpdate()
      this.appendTaskUpdate(fallback)
      this.submissionStatus = fallback.message ?? 'Ответ отправлен (демо).'
      return
    }

    try {
      // Передаём ответ и id вопроса, чтобы бэкенд понимал, что мы пытаемся решить.
      const response = await fetch(`${this.apiBase}/tasks/${this.taskId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: this.selectedOption,
          questionId: this.question.id,
        }),
      })

      if (!response.ok) {
        throw new Error(`status ${response.status}`)
      }

      const update = (await response.json()) as TaskUpdateResponse
      this.appendTaskUpdate(update)
      this.submissionStatus = update.message ?? 'Ответ отправлен.'
    } catch (error) {
      // Любая ошибка при отправке — показываем пользователю сообщение.
      console.error('Ошибка отправки ответа:', error)
      this.submissionStatus = 'Не удалось отправить ответ. Попробуйте ещё раз.'
    }
  }

  resetTask() {
    // Полностью сбрасываем состояние стора (используется при размонтировании страницы).
    this.clearTimers()
    this.taskId = null
    this.title = 'Задача тренажёра'
    this.description = null
    this.question = null
    this.selectedOption = null
    this.submissionStatus = null
    this.terminalLogs = {}
    this.terminalTypes = {}
    this.monitorValues = {}
    this.captureValues = {}
    this.terminalTitles = {}
    this.nextEventTimestamp = Date.now()
    this.pendingEvents = 0
    this.apiBase = undefined
    this.gameStatus = 'in_progress'
    this.gameMessage = null
    this.loading = false
    this.error = null
  }

  private applyTask(task: TaskData) {
    // Применяем данные новой задачи и готовим состояние терминалов.
    this.title = task.title
    this.description = task.description ?? null
    this.question = task.question
    this.selectedOption = null
    this.submissionStatus = null
    this.gameStatus = 'in_progress'
    this.gameMessage = null
    const uniqueTerminals = Array.from(new Set(task.events.map((event) => event.terminal))).sort((a, b) => a - b)
    this.terminalLogs = uniqueTerminals.reduce<Record<number, string[]>>((acc, terminal) => {
      acc[terminal] = []
      return acc
    }, {})
    this.terminalTypes = uniqueTerminals.reduce<Record<number, TerminalKind>>((acc, terminal) => {
      acc[terminal] = 'log'
      return acc
    }, {})
    this.monitorValues = uniqueTerminals.reduce<Record<number, MonitorMetrics | null>>((acc, terminal) => {
      acc[terminal] = null
      return acc
    }, {})
    this.captureValues = uniqueTerminals.reduce<Record<number, CaptureRecord[]>>((acc, terminal) => {
      acc[terminal] = []
      return acc
    }, {})
    this.terminalTitles = uniqueTerminals.reduce<Record<number, string>>((acc, terminal) => {
      acc[terminal] = `Терминал ${terminal}`
      return acc
    }, {})

    for (const event of task.events) {
      // Некоторые события переопределяют заголовок или сразу несут метрики/захваты.
      const title = event.title?.trim()
      if (!title) {
        continue
      }
      this.terminalTitles[event.terminal] = title
      if (event.type === 'monitor' && event.metrics) {
        this.monitorValues[event.terminal] = event.metrics
      }
      if (event.type === 'capture' && event.capture) {
        this.captureValues[event.terminal] = [event.capture]
      }
    }

    this.scheduleEvents(task.events, { reset: true })
  }

  private scheduleEvents(events: TaskEvent[], options: { reset?: boolean } = {}) {
    const { reset = false } = options
    // В режиме reset очищаем очередь и начинаем планирование заново.
    if (reset) {
      this.clearTimers()
      this.nextEventTimestamp = Date.now()
      this.pendingEvents = 0
    }

    const now = Date.now()
    const startFrom = Math.max(this.nextEventTimestamp, now)
    const sorted = [...events].sort((a, b) => a.timeout - b.timeout)
    let previousTime = 0
    let scheduledTime = startFrom

    // Стараемся воспроизвести задержки так, как будто события приходят от сервера с таймаутом в секундах.
    // При этом учитываем, что часть событий может быть уже запланирована — поэтому копим сдвиг относительно последнего события.
    sorted.forEach((event) => {
      const delayStep = Math.max(event.timeout - previousTime, 0) * 1000
      scheduledTime += delayStep
      previousTime = event.timeout

      const delay = Math.max(scheduledTime - now, 0)
      this.pendingEvents += 1
      const timer = window.setTimeout(() => {
        this.addEvent(event)
      }, delay)

      this.timers.push(timer)
    })

    this.nextEventTimestamp = scheduledTime
  }

  private addEvent(event: TaskEvent) {
    // Берём текущие логи и понимаем, какой тип терминала нужно отобразить.
    const currentLogs = this.terminalLogs[event.terminal] ?? []
    const type: TerminalKind = event.type ?? this.terminalTypes[event.terminal] ?? 'log'
    this.terminalTypes = {
      ...this.terminalTypes,
      [event.terminal]: type,
    }
    const title = event.title?.trim() || `Терминал ${event.terminal}`
    this.terminalTitles = {
      ...this.terminalTitles,
      [event.terminal]: title,
    }

    let line = event.text || ''

    if (type === 'monitor') {
      if (event.metrics) {
        // Здесь формируем строку для визуализации метрик, чтобы «табличный» UI не занимался форматированием.
        const { cpu, memory, network } = event.metrics
        line = `CPU: ${cpu}% | RAM: ${memory}%${network !== undefined ? ` | NET: ${network} МБ/с` : ''}`
        this.monitorValues = {
          ...this.monitorValues,
          [event.terminal]: event.metrics,
        }
      } else {
        this.monitorValues = {
          ...this.monitorValues,
          [event.terminal]: null,
        }
      }
    }

    if (type === 'capture') {
      if (event.capture) {
        const { protocol, source, destination, info } = event.capture
        line =
          line ||
          `${protocol}: ${source} → ${destination}${info ? ` (${info})` : ''}`
        const existing = this.captureValues[event.terminal] ?? []
        this.captureValues = {
          ...this.captureValues,
          [event.terminal]: [...existing, event.capture],
        }
      }
    }

    if (!line) {
      // На всякий случай поддерживаем события без текста.
      line = 'Событие без деталей'
    }

    this.terminalLogs = {
      ...this.terminalLogs,
      [event.terminal]: [...currentLogs, line],
    }

    this.pendingEvents = Math.max(0, this.pendingEvents - 1)
    if (this.pendingEvents === 0) {
      this.nextEventTimestamp = Date.now()
    }
  }

  private clearTimers() {
    // Останавливаем все таймеры и обнуляем счётчики.
    this.timers.forEach((timer) => window.clearTimeout(timer))
    this.timers = []
    this.pendingEvents = 0
    this.nextEventTimestamp = Date.now()
  }

  appendTaskUpdate(update: TaskUpdateResponse) {
    // Если сервер прислал новый вопрос, переключаемся на него.
    if (update.question) {
      this.question = update.question
      this.selectedOption = null
      this.submissionStatus = null
    }

    const newEvents = update.events?.filter(Boolean) ?? []
    if (newEvents.length === 0) {
      return
    }

    newEvents.forEach((event) => {
      // Ниже много «если», потому что новые события могут появляться на ранее неизвестных терминалах.
      if (!this.terminalLogs[event.terminal]) {
        this.terminalLogs = {
          ...this.terminalLogs,
          [event.terminal]: [],
        }
      }
      if (!this.terminalTypes[event.terminal]) {
        this.terminalTypes = {
          ...this.terminalTypes,
          [event.terminal]: event.type ?? 'log',
        }
      } else if (event.type) {
        this.terminalTypes = {
          ...this.terminalTypes,
          [event.terminal]: event.type,
        }
      }
      if (!Object.prototype.hasOwnProperty.call(this.monitorValues, event.terminal)) {
        this.monitorValues = {
          ...this.monitorValues,
          [event.terminal]: null,
        }
      }
      if (!Object.prototype.hasOwnProperty.call(this.captureValues, event.terminal)) {
        this.captureValues = {
          ...this.captureValues,
          [event.terminal]: [],
        }
      }
      if (event.title) {
        this.terminalTitles = {
          ...this.terminalTitles,
          [event.terminal]: event.title.trim(),
        }
      } else if (!this.terminalTitles[event.terminal]) {
        this.terminalTitles = {
          ...this.terminalTitles,
          [event.terminal]: `Терминал ${event.terminal}`,
        }
      }
      if (event.type === 'capture' && event.capture) {
        const existing = this.captureValues[event.terminal] ?? []
        this.captureValues = {
          ...this.captureValues,
          [event.terminal]: [...existing, event.capture],
        }
      }
      if (event.type === 'monitor' && event.metrics) {
        this.monitorValues = {
          ...this.monitorValues,
          [event.terminal]: event.metrics,
        }
      }
    })

    this.scheduleEvents(newEvents, { reset: this.pendingEvents === 0 })

    if (update.status === 'win') {
      // Статусы окончания игры выключают поток событий и показывают итоговое сообщение.
      this.clearTimers()
      this.gameStatus = 'win'
      this.gameMessage = update.statusMessage ?? 'Отлично! Вы успешно завершили сценарий.'
    } else if (update.status === 'lose') {
      this.clearTimers()
      this.gameStatus = 'lose'
      this.gameMessage = update.statusMessage ?? 'Сценарий завершён. Попробуйте ещё раз.'
    } else if (update.status === 'continue') {
      this.gameStatus = 'in_progress'
      this.gameMessage = update.statusMessage ?? null
    }
  }

  private buildFallbackUpdate(): TaskUpdateResponse {
    // Демо-ответ, который используется, когда сервер недоступен.
    return {
      message: 'Ответ отправлен (демо). Новые события уже поступают.',
      status: 'continue',
      question: {
        id: 'demo-question-followup',
        text: 'Какое действие выполнить следующим шагом?',
        options: [
          'Проверить состояние остальных хостов.',
          'Сообщить пользователю о возможном инциденте.',
          'Создать тикет на эскалацию в группу реагирования.',
        ],
      },
      events: [
        {
          terminal: 2,
          title: 'siem',
          timeout: 2,
          text: 'SIEM: подтверждение корреляции по IOC #4453, статус – критический',
        },
        {
          terminal: 99,
          title: 'monitor',
          type: 'monitor',
          timeout: 4,
          metrics: { cpu: 63, memory: 70, network: 9 },
        },
        {
          terminal: 4,
          title: 'WireShark',
          type: 'capture',
          timeout: 5,
          capture: {
            time: '12:42:18.412',
            source: '10.0.5.23',
            destination: '185.213.11.4',
            protocol: 'TLS',
            info: 'Client Key Exchange, Change Cipher Spec',
          },
        },
        {
          terminal: 1,
          title: 'proxy',
          timeout: 6,
          text: 'Proxy: пользователю student01 запрещён доступ к внешнему ресурсу',
        },
      ],
    }
  }

  private buildFallbackTask(taskId: string): TaskData {
    // Демо-задача — подстраховка, чтобы можно было играть офлайн.
    return {
      id: taskId,
      title: 'Демо-сценарий: подозрительный трафик',
      description: 'Наблюдаем за тремя терминалами и делаем вывод по вопросу.',
      question: {
        id: 'demo-question-initial',
        text: 'Какое действие выполнить первым?',
        options: [
          'Изолировать рабочую станцию.',
          'Сообщить пользователю о подозрительном трафике.',
          'Проигнорировать событие.',
        ],
      },
      events: [
        { terminal: 1, title: 'proxy', text: '[22s] proxy: GET /login.php', timeout: 1 },
        { terminal: 2, title: 'siem', text: '[25s] siem: правило утечки данных', timeout: 4 },
        { terminal: 99, title: 'monitor', type: 'monitor', metrics: { cpu: 42, memory: 68, network: 12 }, timeout: 5 },
        { terminal: 1, title: 'proxy', text: '[28s] proxy: POST /upload.php 2.5MB', timeout: 7 },
        { terminal: 99, title: 'monitor', type: 'monitor', metrics: { cpu: 58, memory: 72, network: 18 }, timeout: 9 },
        {
          terminal: 4,
          title: 'WireShark',
          type: 'capture',
          timeout: 10,
          capture: {
            time: '12:42:15.345',
            source: '10.0.5.23',
            destination: '185.213.11.4',
            protocol: 'TLS',
            info: 'Client Hello, SNI: login.example.com',
          },
        },
        {
          terminal: 4,
          title: 'WireShark',
          type: 'capture',
          timeout: 12,
          capture: {
            time: '12:42:17.902',
            source: '185.213.11.4',
            destination: '10.0.5.23',
            protocol: 'TLS',
            info: 'Server Hello, Certificate, Server Hello Done',
          },
        },
        { terminal: 3, title: 'edr', text: '[33s] edr: suspicious rundll32.exe', timeout: 11 },
      ],
    }
  }
}
