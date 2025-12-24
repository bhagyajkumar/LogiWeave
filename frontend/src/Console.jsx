import React, { useEffect, useRef, useState } from 'react'

export default function Console({ logs, onClear, onClose }) {
    const endRef = useRef(null)
    const [debugMode, setDebugMode] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const filteredLogs = logs.filter(log =>
        log.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                            {filteredLogs.length} events
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Filter logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                color: '#e2e8f0',
                                width: '180px',
                                outline: 'none'
                            }}
                        />
                        {searchTerm && (
                            <span
                                onClick={() => setSearchTerm('')}
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                ×
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                        onClick={onClear}
                        style={{
                            background: 'transparent',
                            border: '1px solid #ef444450',
                            color: '#ef4444',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            opacity: 0.8,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#ef444410'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        🗑️ Clear
                    </button>
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
                {filteredLogs.length === 0 && (
                    <span style={{ color: '#475569', fontStyle: 'italic' }}>
                        {searchTerm ? 'No matches found...' : 'Ready to run...'}
                    </span>
                )}
                {filteredLogs.map((log, index) => (
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
                        {log.startsWith('__IMG__:') ? (
                            <div style={{ marginTop: '4px' }}>
                                <img
                                    src={log.replace('__IMG__:', '')}
                                    alt="Logged attachment"
                                    style={{
                                        maxWidth: '200px',
                                        maxHeight: '200px',
                                        borderRadius: '8px',
                                        border: '1px solid #334155',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerText = '❌ Failed to load image: ' + log.replace('__IMG__:', '');
                                    }}
                                />
                            </div>
                        ) : (
                            log
                        )}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    )
}
