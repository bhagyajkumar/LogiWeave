import React from 'react'

export default function NodeHeader({
    title,
    isBreakpoint,
    onToggleBreakpoint,
    onDelete,
    leftContent,
    rightContent,
    deletable = true
}) {
    return (
        <div
            style={{
                padding: '8px 12px',
                background: '#111827',
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'move',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* BREAKPOINT TOGGLE */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleBreakpoint?.();
                    }}
                    style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: isBreakpoint ? '#ef4444' : 'transparent',
                        border: '2px solid #ef4444',
                        cursor: 'pointer',
                        boxShadow: isBreakpoint ? '0 0 8px #ef4444' : 'none',
                        transition: 'all 0.2s'
                    }}
                    title="Toggle Breakpoint"
                />
                {leftContent}
                <span>{title}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {rightContent}
                {deletable !== false && (
                    <button
                        className="nodrag"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0 4px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    )
}
