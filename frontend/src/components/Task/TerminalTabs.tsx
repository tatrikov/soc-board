'use client'

import React, { useEffect, useState } from 'react'
import styles from './TerminalTabs.module.css'
import type { CaptureRecord, MonitorMetrics, TerminalKind } from '../../types/task'

interface TerminalTabsProps {
  terminals: number[]
  logs: Record<number, string[]>
  types: Record<number, TerminalKind>
  monitorValues: Record<number, MonitorMetrics | null>
  captureValues: Record<number, CaptureRecord[]>
  loading?: boolean
  titles: Record<number, string>
}

export const TerminalTabs: React.FC<TerminalTabsProps> = ({
  terminals,
  logs,
  types,
  monitorValues,
  captureValues,
  loading = false,
  titles,
}) => {
  const [activeTerminal, setActiveTerminal] = useState<number | null>(terminals[0] ?? null)

  useEffect(() => {
    if (!terminals.length) {
      setActiveTerminal(null)
      return
    }
    if (activeTerminal === null || !terminals.includes(activeTerminal)) {
      setActiveTerminal(terminals[0])
    }
  }, [terminals, activeTerminal])

  const activeLogs = activeTerminal !== null ? logs[activeTerminal] ?? [] : []
  const activeType: TerminalKind = (activeTerminal !== null && types[activeTerminal]) || 'log'
  const activeMetrics = activeTerminal !== null ? monitorValues[activeTerminal] ?? null : null
  const activeCapture = activeTerminal !== null ? captureValues[activeTerminal] ?? [] : []
  const activeTitle =
    activeTerminal !== null ? titles[activeTerminal] ?? `Терминал ${activeTerminal}` : 'Терминал'

  const renderMonitor = () => {
    if (!activeMetrics) {
      return <div className={styles.placeholder}>Ожидаем метрики…</div>
    }

    const { cpu, memory, network } = activeMetrics

    return (
      <div className={styles.monitorGrid}>
        <MonitorGauge label="CPU" value={cpu} unit="%" />
        <MonitorGauge label="RAM" value={memory} unit="%" tone="secondary" />
        {network !== undefined && <MonitorGauge label="NET" value={network} unit="МБ/с" tone="accent" />}
      </div>
    )
  }

  const renderCapture = () => {
    if (!activeCapture.length) {
      return <div className={styles.placeholder}>Ожидаем сетевой трафик…</div>
    }

    return (
      <div className={styles.captureTableWrapper}>
        <table className={styles.captureTable}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Protocol</th>
              <th>Info</th>
            </tr>
          </thead>
          <tbody>
            {activeCapture.map((packet, index) => (
              <tr key={`${activeTerminal}-packet-${index}`}>
                <td>{packet.time}</td>
                <td>{packet.source}</td>
                <td>{packet.destination}</td>
                <td>
                  <span className={styles.captureBadge}>{packet.protocol}</span>
                </td>
                <td>{packet.info}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const streamClassName = `${styles.logStream} ${
    activeType === 'monitor' ? styles.monitorStream : activeType === 'capture' ? styles.captureStream : ''
  }`

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabBar} role="tablist" aria-label="Терминалы сценария">
        {terminals.map((terminal) => {
          const isActive = terminal === activeTerminal
          const terminalTitle = titles[terminal] ?? `Терминал ${terminal}`

          return (
            <button
              key={terminal}
              type="button"
              className={`${styles.tabButton} ${isActive ? styles.active : ''}`}
              onClick={() => setActiveTerminal(terminal)}
              disabled={loading}
              role="tab"
              aria-selected={isActive}
            >
              <span className={styles.tabLabel}>{terminalTitle}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.terminalSurface}>
        {loading && <div className={styles.placeholder}>Загрузка терминала…</div>}

        {!loading && activeTerminal === null && (
          <div className={styles.placeholder}>Нет доступных терминалов для текущей задачи</div>
        )}

        {!loading && activeTerminal !== null && (
          <div className={styles.terminalContent} role="tabpanel" aria-live="polite">
            <div className={styles.terminalHeader}>
              <span className={styles.headerDot} data-variant="red" />
              <span className={styles.headerDot} data-variant="yellow" />
              <span className={styles.headerDot} data-variant="green" />
              <span className={styles.headerTitle}>
                {activeType === 'monitor'
                  ? `${activeTitle} · Монитор ресурсов`
                  : activeType === 'capture'
                    ? `${activeTitle} · WireShark`
                    : activeTitle}
              </span>
            </div>
            <div className={streamClassName}>
              {activeType === 'monitor'
                ? renderMonitor()
                : activeType === 'capture'
                  ? renderCapture()
                  : (
                    <>
                      {activeLogs.length === 0 && <div className={styles.placeholder}>Ожидаем события…</div>}
                      {activeLogs.map((line, index) => (
                        <div key={`${activeTerminal}-${index}`} className={styles.logLine}>
                          <span className={styles.message}>{line}</span>
                        </div>
                      ))}
                    </>
                  )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface MonitorGaugeProps {
  label: string
  value: number
  unit: string
  tone?: 'primary' | 'secondary' | 'accent'
}

const MonitorGauge: React.FC<MonitorGaugeProps> = ({ label, value, unit, tone = 'primary' }) => {
  const clamped = Math.min(Math.max(value, 0), 100)
  const displayValue = Math.round(value)
  return (
    <div className={styles.gaugeCard}>
      <div
        className={`${styles.gauge} ${styles[`gauge_${tone}`]}`}
        style={{ ['--progress' as string]: `${clamped}%` }}
      >
        <div className={styles.gaugeInner}>
          <span className={styles.gaugeValue}>{displayValue}</span>
          <span className={styles.gaugeUnit}>{unit}</span>
        </div>
      </div>
      <span className={styles.gaugeLabel}>{label}</span>
    </div>
  )
}

