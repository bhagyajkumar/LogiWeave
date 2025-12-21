import React, { useState, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import BaseNode from './Components/nodes/BaseNode'
import FlowActions from './FlowActions'
import JsonView from './JsonView'
import dagre from 'dagre'

const nodeTypes = {
  baseNode: BaseNode,
}

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 100 }) // Estimate node size
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      return {
        ...node,
        targetPosition: isHorizontal ? 'left' : 'top',
        sourcePosition: isHorizontal ? 'right' : 'bottom',
        position: {
          x: nodeWithPosition.x - 125, // center-offset (width/2)
          y: nodeWithPosition.y - 50,  // center-offset (height/2)
        },
      }
    }),
    edges,
  }
}

import FlowRunner from './FlowRunner'
import Console from './Console'

export default function App() {
  const [view, setView] = useState('editor') // 'editor' | 'json'
  const [logs, setLogs] = useState([])
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)

  const [nodes, setNodes] = useState([
    {
      id: 'start',
      type: 'baseNode',
      position: { x: 50, y: 50 },
      draggable: false,
      deletable: false,
      data: {
        title: 'Start',
        deletable: false, // 🔥 Hide delete button
        inputs: [],
        outputs: [
          { id: 'exec', type: 'exec', label: '' }
        ],
      },
    },
    {
      id: '1',
      type: 'baseNode',
      position: { x: 400, y: 50 },
      data: {
        title: 'Add',
        inputs: [
          { id: 'exec-in', type: 'exec', label: '' },
          { id: 'a', type: 'number', label: 'A' },
          { id: 'b', type: 'number', label: 'B' },
        ],
        outputs: [
          { id: 'exec-out', type: 'exec', label: '' },
          { id: 'result', type: 'number', label: 'Result' },
        ],
      },
    },
  ])

  const [edges, setEdges] = useState([])

  const onEdgesChange = (changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }

  const onConnect = (connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          type: 'default',
        },
        eds
      )
    )
  }

  const onNodesChange = (changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }

  // 🔥 REMOVE EDGES ON NODE DELETE
  const onNodesDelete = (deleted) => {
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !deleted.some((node) => node.id === e.source || node.id === e.target)
      )
    )
  }

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    )
    setNodes([...layoutedNodes])
    setEdges([...layoutedEdges])
  }, [nodes, edges])

  const handleRun = async () => {
    setIsConsoleOpen(true)
    setLogs([]) // Clear previous logs

    const runner = new FlowRunner(nodes, edges, (msg) => {
      setLogs((prev) => [...prev, msg])
    })

    await runner.run()
  }

  return (
    <div style={{ height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* 🔥 Navigation Bar */}
      <div
        style={{
          height: 50,
          background: '#111827',
          borderBottom: '1px solid #374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>Flow Editor</span>

          {/* RUN BUTTON */}
          <button
            onClick={handleRun}
            style={{
              padding: '6px 12px',
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>▶</span> Run Flow
          </button>

          <button
            onClick={onLayout}
            style={{
              padding: '4px 10px',
              background: '#8b5cf6',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Auto Layout
          </button>
        </div>
        <button
          onClick={() => setView(view === 'editor' ? 'json' : 'editor')}
          style={{
            padding: '6px 12px',
            background: view === 'json' ? '#3b82f6' : '#374151',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {view === 'json' ? 'Hide JSON' : 'Show JSON'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* 🔥 React Flow Canvas (Left Pane) */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            {/* 🔥 Overlay UI */}
            <FlowActions setNodes={setNodes} />

            {/* BRANDING HEADER */}
            <div style={{
              position: 'absolute',
              top: 12,
              right: 20,
              zIndex: 1000,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                padding: '6px 12px',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '800',
                fontSize: '18px',
                letterSpacing: '-0.5px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}>
                LogiWeave
              </div>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodesDelete={onNodesDelete}
              onConnect={onConnect}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap style={{ background: '#1f2937' }} nodeColor={() => '#374151'} maskColor="rgba(0, 0, 0, 0.4)" />
            </ReactFlow>
          </div>

          {/* 🔥 Console (Bottom Pane Overlay) */}
          {isConsoleOpen && (
            <Console logs={logs} onClose={() => setIsConsoleOpen(false)} />
          )}
        </div>

        {/* 🔥 JSON View (Right Pane - Toggleable) */}
        {view === 'json' && (
          <div
            style={{
              width: '400px',
              borderLeft: '1px solid #374151',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <JsonView nodes={nodes} edges={edges} onBack={() => setView('editor')} isPanel={true} />
          </div>
        )}
      </div>
    </div>
  )
}
