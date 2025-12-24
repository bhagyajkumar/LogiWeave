import { useState } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'
import NodeHeader from './parts/NodeHeader'
import NodeInputRow from './parts/NodeInputRow'
import NodeOutputRow from './parts/NodeOutputRow'
import InspectorPopup from './parts/InspectorPopup'
import HttpRequestImport from './parts/HttpRequestImport'
import HttpRequestExport from './parts/HttpRequestExport'

const METHOD_COLORS = {
    GET: '#3b82f6',
    POST: '#10b981',
    PUT: '#f59e0b',
    DELETE: '#ef4444',
    PATCH: '#8b5cf6',
}

export default function HttpRequestNode({ data, id }) {
    const { setNodes } = useReactFlow()
    const [isImporting, setIsImporting] = useState(false)
    const [isExportingCode, setIsExportingCode] = useState(false)
    const [inspectingOutput, setInspectingOutput] = useState(null)

    const dataInputs = data.inputs?.filter(i => i.type !== 'exec') || []
    const dataOutputs = data.outputs?.filter(o => o.type !== 'exec') || []

    const handleDelete = () => {
        setNodes((nodes) => nodes.filter((n) => n.id !== id))
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

    const methodInput = dataInputs.find(i => i.id === 'method')
    const urlInput = dataInputs.find(i => i.id === 'url')
    const currentMethod = methodInput?.value || 'GET'

    const leftHeaderContent = (
        <div
            style={{
                background: METHOD_COLORS[currentMethod] || '#6b7280',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 800,
                color: '#fff',
            }}
        >
            {currentMethod}
        </div>
    )

    const rightHeaderContent = (
        <div style={{ display: 'flex', gap: 8, marginRight: 8 }}>
            <button className="nodrag" onClick={() => setIsImporting(true)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '10px', fontWeight: '700', cursor: 'pointer', opacity: 0.8 }}>⚡ IMPORT</button>
            <button className="nodrag" onClick={() => setIsExportingCode(true)} style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '10px', fontWeight: '700', cursor: 'pointer', opacity: 0.8 }}>📂 CODE</button>
        </div>
    )

    return (
        <div
            style={{
                background: '#1f2937',
                color: '#ffffff',
                borderRadius: 12,
                minWidth: 320,
                border: data.isExecuting ? '2px solid #3b82f6' : '1px solid #374151',
                boxShadow: data.isExecuting
                    ? '0 0 20px rgba(59, 130, 246, 0.6)'
                    : '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                animation: data.isExecuting ? 'nodeHighlight 2s infinite' : 'none',
                transition: 'all 0.2s ease-in-out',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <NodeHeader
                title={data.title}
                isBreakpoint={data.isBreakpoint}
                onToggleBreakpoint={data.onToggleBreakpoint}
                onDelete={handleDelete}
                leftContent={leftHeaderContent}
                rightContent={rightHeaderContent}
            />

            {isImporting && (
                <HttpRequestImport id={id} onClose={() => setIsImporting(false)} />
            )}

            <div style={{ padding: '12px 0' }}>
                {/* Method & URL Row */}
                <div style={{ position: 'relative', width: '100%', padding: '0 14px 12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select className="nodrag" value={currentMethod} onChange={(e) => handleInputChange('method', e.target.value)} style={{ background: '#374151', border: '1px solid #4b5563', color: '#fff', padding: '6px 8px', borderRadius: 6, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                            {Object.keys(METHOD_COLORS).map(m => (<option key={m} value={m}>{m}</option>))}
                        </select>
                        <input type="text" placeholder="https://api.example.com" className="nodrag" value={urlInput?.value || ''} onChange={(e) => handleInputChange('url', e.target.value)} style={{ flex: 1, background: '#111827', border: '1px solid #4b5563', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12, outline: 'none' }} />
                    </div>
                    <Handle id="method" type="target" position={Position.Left} style={{ left: -7, top: '50%', transform: 'translateY(-50%)', background: '#3b82f6', width: 14, height: 14, zIndex: 1000, border: '2px solid #1f2937', cursor: 'crosshair' }} />
                </div>

                {/* Other Inputs (Params, Headers, Body) */}
                {dataInputs.filter(i => !['url', 'method'].includes(i.id)).map((input) => (
                    <div key={input.id} style={{ position: 'relative', width: '100%', padding: '0 14px 10px 14px' }}>
                        <label style={{ fontSize: 10, color: '#9ca3af', display: 'block', marginBottom: 4 }}>{input.label}</label>
                        <textarea className="nodrag" value={input.value || ''} onChange={(e) => handleInputChange(input.id, e.target.value)} placeholder={`{ }`} style={{ width: '100%', minHeight: 40, background: '#111827', border: '1px solid #4b5563', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace', outline: 'none', resize: 'vertical' }} />
                        <Handle id={input.id} type="target" position={Position.Left} style={{ left: -7, top: '50%', transform: 'translateY(-50%)', background: '#8b5cf6', width: 14, height: 14, zIndex: 1000, border: '2px solid #1f2937', cursor: 'crosshair' }} />
                    </div>
                ))}

                <div style={{ borderTop: '1px solid #374151', marginTop: 4, background: '#11182750', padding: '8px 0' }}>
                    {dataOutputs.map(output => (
                        <NodeOutputRow
                            key={output.id}
                            output={output}
                            executionResult={data.executionResult}
                            onInspect={setInspectingOutput}
                        />
                    ))}
                </div>
            </div>

            {isExportingCode && (
                <HttpRequestExport data={data} onClose={() => setIsExportingCode(false)} />
            )}

            <Handle id="exec-in" type="target" position={Position.Left} style={{ left: -9, top: 18, background: '#fff', width: 18, height: 18, zIndex: 1001, border: '4px solid #111827', cursor: 'crosshair' }} />
            <Handle id="exec-out" type="source" position={Position.Right} style={{ right: -9, top: 18, background: '#fff', width: 18, height: 18, zIndex: 1001, border: '4px solid #111827', cursor: 'crosshair' }} />

            <InspectorPopup
                inspectingOutput={inspectingOutput}
                onClose={() => setInspectingOutput(null)}
            />
        </div>
    )
}
