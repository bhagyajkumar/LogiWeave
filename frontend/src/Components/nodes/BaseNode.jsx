import React, { useState } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'
import NodeHeader from './parts/NodeHeader'
import NodeInputRow from './parts/NodeInputRow'
import NodeOutputRow from './parts/NodeOutputRow'
import InspectorPopup from './parts/InspectorPopup'

export default function BaseNode({ data, id }) {
  const [inspectingOutput, setInspectingOutput] = useState(null)
  const { setNodes } = useReactFlow()

  const execInputs = data.inputs?.filter(i => i.type === 'exec') || []
  const dataInputs = data.inputs?.filter(i => i.type !== 'exec') || []
  const execOutputs = data.outputs?.filter(o => o.type === 'exec') || []
  const dataOutputs = data.outputs?.filter(o => o.type !== 'exec') || []

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id))
  }

  const handleAddInput = () => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          const currentInputs = node.data.inputs || []
          const isSubflowNode = ['subflow start', 'subflow call', 'subflow return'].includes(node.data.title.toLowerCase())
          const firstInput = currentInputs.find((i) => i.type !== 'exec' && i.id !== 'name')
          const type = isSubflowNode ? 'any' : (firstInput ? firstInput.type : 'number')

          const isSubflowCall = node.data.title.toLowerCase() === 'subflow call'
          const defaultValue = isSubflowCall ? 5 : (type === 'number' ? 0 : '')

          const dataInputsCount = currentInputs.filter(i => i.type !== 'exec' && i.id !== 'name').length
          const label = `In ${dataInputsCount + 1}`
          const newId = `${type}-${crypto.randomUUID().slice(0, 4)}`

          return {
            ...node,
            data: {
              ...node.data,
              inputs: [...currentInputs, { id: newId, type, label, value: defaultValue }],
            },
          }
        }
        return node
      })
    )
  }

  const handleAddOutput = () => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          const currentOutputs = node.data.outputs || []
          const isSubflowNode = ['subflow start', 'subflow call', 'subflow return'].includes(node.data.title.toLowerCase())
          const firstOutput = currentOutputs.find((o) => o.type !== 'exec')
          const type = isSubflowNode ? 'any' : (firstOutput ? firstOutput.type : 'any')

          const dataOutputsCount = currentOutputs.filter(o => o.type !== 'exec').length
          const label = `Out ${dataOutputsCount + 1}`
          const newId = `${type}-${crypto.randomUUID().slice(0, 4)}`

          return {
            ...node,
            data: {
              ...node.data,
              outputs: [...currentOutputs, { id: newId, type, label }],
            },
          }
        }
        return node
      })
    )
  }

  const handleRemoveInput = (inputId) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              inputs: node.data.inputs.filter((i) => i.id !== inputId),
            },
          }
        }
        return node
      })
    )
  }

  const handleRemoveOutput = (outputId) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              outputs: node.data.outputs.filter((o) => o.id !== outputId),
            },
          }
        }
        return node
      })
    )
  }

  const handleInputChange = (inputId, newValue) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              inputs: node.data.inputs.map((input) =>
                input.id === inputId ? { ...input, value: newValue } : input
              ),
            },
          }
        }
        return node
      })
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        background: '#1f2937',
        color: '#ffffff',
        borderRadius: 10,
        minWidth: 240,
        minHeight: 90,
        border: data.isExecuting ? '2px solid #3b82f6' : '1px solid #374151',
        boxShadow: data.isExecuting
          ? '0 0 20px rgba(59, 130, 246, 0.6)'
          : '0 15px 30px rgba(0,0,0,0.35)',
        animation: data.isExecuting ? 'nodeHighlight 2s infinite' : 'none',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <NodeHeader
        title={data.title}
        isBreakpoint={data.isBreakpoint}
        onToggleBreakpoint={data.onToggleBreakpoint}
        onDelete={handleDelete}
        deletable={data.deletable}
      />

      {/* BODY */}
      <div
        style={{
          padding: '12px',
          paddingTop: Math.max(50, 20 + (execOutputs.length * 30)),
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        {/* LEFT SIDE (DATA INPUTS) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dataInputs.map((input, index) => (
            <NodeInputRow
              key={input.id}
              input={input}
              onInputChange={handleInputChange}
              onRemove={handleRemoveInput}
              showRemove={data.dynamicInputs && index > 1}
            />
          ))}

          {data.dynamicInputs && (
            <div
              onClick={handleAddInput}
              style={{
                fontSize: 10,
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '2px 6px',
                border: '1px dashed #4b5563',
                borderRadius: 4,
                textAlign: 'center',
                marginTop: 4,
                userSelect: 'none',
              }}
            >
              + Add Input
            </div>
          )}
        </div>

        {/* RIGHT SIDE (DATA OUTPUTS) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          {dataOutputs.map((output) => (
            <NodeOutputRow
              key={output.id}
              output={output}
              executionResult={data.executionResult}
              onInspect={setInspectingOutput}
              onRemove={handleRemoveOutput}
              showRemove={data.dynamicOutputs && output.type !== 'exec'}
            />
          ))}

          {data.dynamicOutputs && (
            <div
              onClick={handleAddOutput}
              style={{
                fontSize: 10,
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '2px 6px',
                border: '1px dashed #4b5563',
                borderRadius: 4,
                textAlign: 'center',
                marginTop: 4,
                userSelect: 'none',
              }}
            >
              + Add Output
            </div>
          )}
        </div>
      </div>

      {/* EXEC HANDLES & LABELS */}
      {execInputs.length > 0 && (
        <Handle
          id={execInputs[0].id}
          type="target"
          position={Position.Left}
          style={{ position: 'absolute', left: -8, top: 52, background: '#ffffff', width: 16, height: 16, zIndex: 101, border: '3px solid #111827' }}
        />
      )}

      {execOutputs.map((output, index) => (
        <Handle
          key={output.id}
          id={output.id}
          type="source"
          position={Position.Right}
          style={{ position: 'absolute', right: -8, top: 52 + (index * 30), background: '#ffffff', width: 16, height: 16, zIndex: 101, border: '3px solid #111827' }}
        />
      ))}

      <div style={{ position: 'absolute', right: 18, top: 48, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16, pointerEvents: 'none' }}>
        {execOutputs.map((o) => (
          <div key={o.id} style={{ fontSize: 12, height: 14 }}>{o.label}</div>
        ))}
      </div>

      <InspectorPopup
        inspectingOutput={inspectingOutput}
        onClose={() => setInspectingOutput(null)}
      />
    </div>
  )
}
