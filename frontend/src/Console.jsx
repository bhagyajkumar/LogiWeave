import React, { useEffect, useRef, useState } from 'react'

export default function Console({ logs, onClose }) {
    const endRef = useRef(null)
    const [debugMode, setDebugMode] = useState(false)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '250px',
                background: '#0f172a',
                borderTop: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 50,
                fontFamily: 'monospace',
                boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '8px 16px',
                    background: '#1e293b',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#e2e8f0' }}>Console</span>
                    <span
                        style={{
                            fontSize: '12px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#334155',
                            color: '#94a3b8',
                        }}
                    >
                        {logs.length} events
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                        onClick={() => setDebugMode(!debugMode)}
                        style={{
                            padding: '4px 8px',
                            background: debugMode ? '#22c55e' : '#334155',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                        }}
                    >
                        🐛 Debug {debugMode ? 'ON' : 'OFF'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '4px',
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Logs Area */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                }}
            >
                {logs.length === 0 && (
                    <span style={{ color: '#475569', fontStyle: 'italic' }}>Ready to run...</span>
                )}
                {logs.map((log, index) => (
                    <div
                        key={index}
                        style={{
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: log.startsWith('❌')
                                ? '#ef4444'
                                : log.startsWith('✅')
                                    ? '#22c55e'
                                    : log.startsWith('🚀') || log.startsWith('▶')
                                        ? '#60a5fa'
                                        : '#cbd5e1',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        <span style={{ color: '#475569', marginRight: '8px', fontSize: '11px' }}>
                            {new Date().toLocaleTimeString()}
                        </span>
                        {log}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    )
}
