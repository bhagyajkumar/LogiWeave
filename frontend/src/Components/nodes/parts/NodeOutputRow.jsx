import React from 'react'
import { Handle, Position } from 'reactflow'

const PIN_COLORS = {
    exec: '#ffffff',
    number: '#22c55e',
    string: '#3b82f6',
    boolean: '#facc15',
    any: '#8b5cf6',
}

export default function NodeOutputRow({
    output,
    executionResult,
    onInspect,
    onRemove,
    showRemove = false
}) {
    const resultValue = executionResult?.[output.id]

    return (
        <div
            className="nodrag"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, minHeight: 24 }}
        >
            {resultValue !== undefined && (
                <div
                    onClick={() => onInspect({
                        id: output.id,
                        label: output.label,
                        value: resultValue
                    })}
                    style={{
                        background: '#1e293b',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#60a5fa',
                        border: '1px solid #3b82f6',
                        maxWidth: 100,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                        transition: 'all 0.2s',
                    }}
                >
                    {String(resultValue)}
                </div>
            )}
            {showRemove && (
                <button
                    className="nodrag"
                    onClick={() => onRemove(output.id)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        fontSize: 10,
                        padding: '0 2px',
                    }}
                >
                    ×
                </button>
            )}
            <span style={{ fontSize: 12 }}>{output.label}</span>
            <Handle
                id={output.id}
                type="source"
                position={Position.Right}
                isConnectable={true}
                className="nodrag"
                style={{
                    position: 'absolute',
                    right: -24,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: PIN_COLORS[output.type] || '#8b5cf6',
                    width: 16,
                    height: 16,
                    zIndex: 1000,
                    border: '2px solid #1f2937',
                    cursor: 'crosshair',
                    pointerEvents: 'all',
                }}
            />
        </div>
    )
}
