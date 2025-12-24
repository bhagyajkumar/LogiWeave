import React from 'react'
import { Handle, Position } from 'reactflow'

const PIN_COLORS = {
    exec: '#ffffff',
    number: '#22c55e',
    string: '#3b82f6',
    boolean: '#facc15',
    any: '#8b5cf6',
}

export default function NodeInputRow({
    input,
    onInputChange,
    onRemove,
    showRemove = false,
    children
}) {
    return (
        <div
            className="nodrag"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, minHeight: 24 }}
        >
            <Handle
                id={input.id}
                type="target"
                position={Position.Left}
                isConnectable={true}
                className="nodrag"
                style={{
                    position: 'absolute',
                    left: -24,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: PIN_COLORS[input.type] || '#8b5cf6',
                    width: 16,
                    height: 16,
                    zIndex: 1000,
                    border: '2px solid #1f2937',
                    cursor: 'crosshair',
                    pointerEvents: 'all',
                }}
            />
            <span style={{ fontSize: 12 }}>{input.label}</span>
            {showRemove && (
                <button
                    className="nodrag"
                    onClick={() => onRemove(input.id)}
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
            {children || (
                (input.type === 'number' || input.type === 'string') && (
                    <input
                        type={input.type === 'number' ? 'number' : 'text'}
                        value={input.value ?? ''}
                        onChange={(e) => onInputChange(input.id, e.target.value)}
                        className="nodrag"
                        style={{
                            marginLeft: 8,
                            background: '#111827',
                            border: '1px solid #4b5563',
                            color: '#ffffff',
                            fontSize: 10,
                            padding: '2px 4px',
                            borderRadius: 4,
                            width: 60,
                            outline: 'none',
                        }}
                    />
                )
            )}
        </div>
    )
}
