import { Handle, Position, useReactFlow } from 'reactflow'

const PIN_COLORS = {
  exec: '#ffffff',
  number: '#22c55e',
  string: '#3b82f6',
  boolean: '#facc15',
  any: '#8b5cf6', // Purple for any/dynamic
}

export default function BaseNode({ data, id, isConnectable }) {
  const execInputs = data.inputs?.filter(i => i.type === 'exec') || []
  const dataInputs = data.inputs?.filter(i => i.type !== 'exec') || []

  const execOutputs = data.outputs?.filter(o => o.type === 'exec') || []
  const dataOutputs = data.outputs?.filter(o => o.type !== 'exec') || []
  const { setNodes } = useReactFlow()

  const handleDelete = (e) => {
    e.stopPropagation() // prevent drag/select
    setNodes((nodes) => nodes.filter((n) => n.id !== id))
  }

  const handleAddInput = () => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          const currentInputs = node.data.inputs || []
          const isSubflowNode = ['subflow start', 'subflow call', 'subflow return'].includes(node.data.title.toLowerCase())
          const type = isSubflowNode ? 'any' : (firstInput ? firstInput.type : 'number')

          // 🔥 Special logic for Subflow Call: default value is 5
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


  const hasExec = execInputs.length > 0 || execOutputs.length > 0
  const bodyPaddingTop = Math.max(50, 20 + (execOutputs.length * 30))
  const handleBaseTop = 36 + bodyPaddingTop + 8 // Header (~36px) + Dynamic Padding + Half-row adjustment

  return (
    <div
      style={{
        position: 'relative',
        background: '#1f2937',
        color: '#ffffff',
        borderRadius: 10,
        minWidth: 240,
        minHeight: 90,
        border: '1px solid #374151',
        boxShadow: '0 15px 30px rgba(0,0,0,0.35)',
      }}
    >
      {/* HEADER */}
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
        <span>{data.title}</span>
        {data.deletable !== false && (
          <button
            className="nodrag"
            onClick={handleDelete}
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

      {/* BODY */}
      <div
        style={{
          padding: '12px',
          paddingTop: Math.max(50, 20 + (execOutputs.length * 30)), // 🔥 Dynamic padding based on exec outputs
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        {/* LEFT SIDE (DATA INPUTS) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dataInputs.map((input, index) => (
            <div
              key={input.id}
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
              {data.dynamicInputs && index > 1 && ( // Only allow removing if it's a dynamic node and not the first mandatory inputs
                <button
                  className="nodrag"
                  onClick={() => handleRemoveInput(input.id)}
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
              {(input.type === 'number' || input.type === 'string') && (
                <input
                  type={input.type === 'number' ? 'number' : 'text'}
                  value={input.value ?? ''}
                  onChange={(e) => handleInputChange(input.id, e.target.value)}
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
              )}
            </div>
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'flex-end',
          }}
        >
          {dataOutputs.map((output) => (
            <div
              key={output.id}
              className="nodrag"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, minHeight: 24 }}
            >
              {data.dynamicOutputs && output.type !== 'exec' && (
                <button
                  className="nodrag"
                  onClick={() => handleRemoveOutput(output.id)}
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

      {/* EXEC INPUT (TOP LEFT) */}
      {
        execInputs.length > 0 && (
          <Handle
            id={execInputs[0].id}
            type="target"
            position={Position.Left}
            style={{
              position: 'absolute',
              left: -8,
              top: 52,
              background: '#ffffff',
              width: 16, // 🔥 Larger
              height: 16,
              zIndex: 101, // 🔥 Above data pins
              border: '3px solid #111827',
            }}
          />
        )
      }

      {/* EXEC OUTPUTS (ABSOLUTE, SEPARATE SLOTS) */}
      {
        execOutputs.map((output, index) => (
          <Handle
            key={output.id}
            id={output.id}
            type="source"
            position={Position.Right}
            style={{
              position: 'absolute',
              right: -8,
              top: 52 + (index * 30), // 🔥 Matches label spacing
              background: '#ffffff',
              width: 16,
              height: 16,
              zIndex: 101, // 🔥 Above data pins
              border: '3px solid #111827',
            }}
          />
        ))
      }

      {/* EXEC OUTPUT LABELS */}
      <div
        style={{
          position: 'absolute',
          right: 18,
          top: 48, // 🔥 Align with handles
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end', // Right align text
          gap: 16, // 🔥 Adjusted to match handle spacing (Handles are ~12px height + gap)
          pointerEvents: 'none'
        }}
      >
        {execOutputs.map((o) => (
          <div key={o.id} style={{ fontSize: 12, height: 14 }}>{o.label}</div> // Fixed height for alignment
        ))}
      </div>

    </div >
  )
}
