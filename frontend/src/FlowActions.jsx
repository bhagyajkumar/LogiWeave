import { useState } from 'react'
import { Button } from 'react-bootstrap'
import { useReactFlow } from 'reactflow'
import templates from './nodeTemplates.json'
import { createNodeFromTemplate } from './createNodeFromTemplate'

export default function FlowActions({ setNodes }) {
  const { project } = useReactFlow()
  const [isExpanded, setIsExpanded] = useState(false)

  const spawn = (key) => {
    const position = project({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })

    setNodes((nds) =>
      nds.concat(
        createNodeFromTemplate(key, templates[key], position)
      )
    )
    setIsExpanded(false) // Auto-close after selection
  }

  // 🔥 Group templates by category
  const groupedTemplates = Object.entries(templates)
    .filter(([key]) => key !== 'start') // never allow spawning Start
    .reduce((acc, [key, template]) => {
      const category = template.category || 'Other'
      acc[category] = acc[category] || []
      acc[category].push({ key, title: template.title })
      return acc
    }, {})

  if (!isExpanded) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1000,
        }}
      >
        <Button
          onClick={() => setIsExpanded(true)}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontWeight: 600,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          + Add Node
        </Button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 1000,
        background: '#111827',
        padding: 8,
        borderRadius: 8,
        maxHeight: '80vh',
        overflowY: 'auto',
        minWidth: 200,
        border: '1px solid #374151',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid #374151',
        }}
      >
        <span style={{ color: '#fff', fontWeight: 600 }}>Add Node</span>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: 18,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {Object.entries(groupedTemplates).map(([category, nodes]) => (
        <div key={category} style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#9ca3af',
              marginBottom: 4,
              textTransform: 'uppercase',
            }}
          >
            {category}
          </div>

          {nodes.map(({ key, title }) => (
            <Button
              key={key}
              size="sm"
              variant="secondary"
              style={{
                width: '100%',
                marginBottom: 4,
                textAlign: 'left',
                background: '#1f2937',
                border: '1px solid #374151',
                color: '#e5e7eb',
                padding: '6px 10px',
              }}
              onClick={() => spawn(key)}
            >
              {title}
            </Button>
          ))}
        </div>
      ))}
    </div>
  )
}
