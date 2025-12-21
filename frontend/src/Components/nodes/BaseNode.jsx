import { Handle, Position, useReactFlow } from 'reactflow'

const PIN_COLORS = {
  exec: '#ffffff',
  number: '#22c55e',
  string: '#3b82f6',
  boolean: '#facc15',
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
          const firstInput = currentInputs.find((i) => i.type !== 'exec')
          const type = firstInput ? firstInput.type : 'number'
          const label = `In ${currentInputs.length + 1}`
          const newId = `${type}-${crypto.randomUUID().slice(0, 4)}`

          return {
            ...node,
            data: {
              ...node.data,
              inputs: [...currentInputs, { id: newId, type, label, value: type === 'number' ? 0 : '' }],
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
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Handle
                id={input.id}
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                style={{
                  position: 'absolute',
                  left: -24,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: PIN_COLORS[input.type],
                  width: 10,
                  height: 10,
                  zIndex: 10,
                }}
              />
              <span style={{ fontSize: 12 }}>{input.label}</span>
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
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span style={{ fontSize: 12 }}>{output.label}</span>
              <Handle
                id={output.id}
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                style={{
                  position: 'absolute',
                  right: -24,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: PIN_COLORS[output.type],
                  width: 10,
                  height: 10,
                  zIndex: 10,
                }}
              />
            </div>
          ))}
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
              left: -6,
              top: 52,
              background: '#ffffff',
              width: 12,
              height: 12,
              zIndex: 20, // 🔥 Above data pins
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
              right: -6,
              top: 52 + (index * 30), // 🔥 Matches label spacing
              background: '#ffffff',
              width: 12,
              height: 12,
              zIndex: 20, // 🔥 Above data pins
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
