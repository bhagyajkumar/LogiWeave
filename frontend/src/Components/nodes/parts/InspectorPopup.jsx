import React from 'react'

export default function InspectorPopup({ inspectingOutput, onClose }) {
    if (!inspectingOutput) return null

    return (
        <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 10,
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: 8,
            zIndex: 3000,
            padding: 12,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 120,
            maxHeight: 300
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa' }}>
                    Inspector: {inspectingOutput.label || inspectingOutput.id}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className="nodrag"
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(inspectingOutput.value, null, 2))
                        }}
                        style={{ background: '#374151', border: 'none', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}
                    >
                        Copy
                    </button>
                    <button
                        className="nodrag"
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 14, cursor: 'pointer', padding: '0 4px' }}
                    >
                        ✕
                    </button>
                </div>
            </div>
            <div style={{
                flex: 1,
                background: '#0a0f1a',
                borderRadius: 6,
                padding: 8,
                color: '#d1d5db',
                fontSize: 10,
                fontFamily: 'monospace',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
            }}>
                {typeof inspectingOutput.value === 'object'
                    ? JSON.stringify(inspectingOutput.value, null, 2)
                    : String(inspectingOutput.value)}
            </div>
        </div>
    )
}
