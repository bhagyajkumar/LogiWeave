import React, { useState } from 'react'
import templates from '../nodeTemplates.json'

export default function ContextMenu({ x, y, clientX, clientY, onClick, onSpawn }) {
    const [searchTerm, setSearchTerm] = useState('')

    // 🔥 Group templates by category
    const groupedTemplates = Object.entries(templates)
        .filter(([key]) => key !== 'start') // never allow spawning Start
        .filter(([_, template]) =>
            template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (template.category && template.category.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .reduce((acc, [key, template]) => {
            const category = template.category || 'Other'
            acc[category] = acc[category] || []
            acc[category].push({ key, title: template.title })
            return acc
        }, {})

    return (
        <div
            onClick={onClick}
            style={{
                position: 'fixed',
                top: clientY,
                left: clientX,
                zIndex: 2000,
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: 8,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                minWidth: 220,
                maxHeight: 400,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '8px 0',
            }}
        >
            <div style={{ padding: '0 8px 8px 8px', borderBottom: '1px solid #374151', marginBottom: 8 }}>
                <input
                    autoFocus
                    type="text"
                    placeholder="Search nodes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()} // don't close menu when clicking input
                    style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: 12,
                        color: '#e2e8f0',
                        outline: 'none'
                    }}
                />
            </div>

            {Object.entries(groupedTemplates).length === 0 && (
                <div style={{ padding: '8px 16px', color: '#4b5563', fontSize: 12, fontStyle: 'italic' }}>
                    No nodes found...
                </div>
            )}

            {Object.entries(groupedTemplates).map(([category, items]) => (
                <div key={category}>
                    <div style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: '#6b7280',
                        padding: '8px 16px 4px 16px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {category}
                    </div>
                    {items.map(({ key, title }) => (
                        <div
                            key={key}
                            onClick={(e) => {
                                e.stopPropagation()
                                onSpawn(key, { x, y })
                            }}
                            style={{
                                padding: '6px 16px',
                                fontSize: 13,
                                color: '#d1d5db',
                                cursor: 'pointer',
                                transition: 'all 0.1s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#3b82f6'
                                e.target.style.color = '#fff'
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent'
                                e.target.style.color = '#d1d5db'
                            }}
                        >
                            {title}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}
