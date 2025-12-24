import { useState } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'

const PIN_COLORS = {
    exec: '#ffffff',
    number: '#22c55e',
    string: '#3b82f6',
    boolean: '#facc15',
    any: '#8b5cf6',
}

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
    const [selectedFormat, setSelectedFormat] = useState('curl')
    const [curlInput, setCurlInput] = useState('')
    const [copyFeedback, setCopyFeedback] = useState(false)

    const execInputs = data.inputs?.filter(i => i.type === 'exec') || []
    const execOutputs = data.outputs?.filter(o => o.type === 'exec') || []

    const dataInputs = data.inputs?.filter(i => i.type !== 'exec') || []
    const dataOutputs = data.outputs?.filter(o => o.type !== 'exec') || []

    const handleDelete = (e) => {
        e.stopPropagation()
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

    const handleImportCurl = () => {
        if (!curlInput.trim()) return

        // Basic cURL Parser Logic
        const curl = curlInput.trim()
        let result = {
            method: 'GET',
            url: '',
            headers: {},
            body: ''
        }

        // 1. Extract URL (usually the first 'http' match not preceded by -)
        const urlMatch = curl.match(/(?:^|\s)["']?(https?:\/\/[^"'\s]+)["']?/)
        if (urlMatch) result.url = urlMatch[1]

        // 2. Extract Method
        const methodMatch = curl.match(/(?:-X|--request)\s+["']?(\w+)["']?/i)
        if (methodMatch) result.method = methodMatch[1].toUpperCase()

        // 3. Extract Headers
        const headerMatches = curl.matchAll(/(?:-H|--header)\s+["']([^"']+)["']/g)
        for (const match of headerMatches) {
            const [key, value] = match[1].split(/:\s*(.*)/)
            if (key && value) result.headers[key.trim()] = value.trim()
        }

        // 4. Extract Body
        const bodyMatch = curl.match(/(?:-d|--data|--data-raw|--data-binary)\s+["']?(.*?)["']?($|\s+-(?:H|X|A|e|b|c|f|s|S|i|m|y|z|L|k|v|o|p|E|n|T|r|w|q|#))/s)
        if (bodyMatch) result.body = bodyMatch[1]

        // If it has a body but no method, assume POST
        if (result.body && result.method === 'GET') result.method = 'POST'

        // Apply to node
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            inputs: node.data.inputs.map((input) => {
                                if (input.id === 'url') return { ...input, value: result.url }
                                if (input.id === 'method') return { ...input, value: result.method }
                                if (input.id === 'headers') return { ...input, value: JSON.stringify(result.headers, null, 2) }
                                if (input.id === 'body') return { ...input, value: result.body }
                                return input
                            }),
                        },
                    }
                }
                return node
            })
        )

        setIsImporting(false)
        setCurlInput('')
    }

    const methodInput = dataInputs.find(i => i.id === 'method')
    const urlInput = dataInputs.find(i => i.id === 'url')
    const queryParamsInput = dataInputs.find(i => i.id === 'params')
    const headersInput = dataInputs.find(i => i.id === 'headers')
    const bodyInput = dataInputs.find(i => i.id === 'body')
    const currentMethod = methodInput?.value || 'GET'

    const generateCode = (format) => {
        const url = urlInput?.value || 'https://api.example.com'
        const method = currentMethod
        let headers = {}
        try { headers = JSON.parse(headersInput?.value || '{}') } catch (e) { }
        let params = {}
        try { params = JSON.parse(queryParamsInput?.value || '{}') } catch (e) { }
        const body = bodyInput?.value || ''

        // Append query params to URL for display
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
        Object.entries(params).forEach(([k, v]) => urlObj.searchParams.append(k, v))
        const finalUrl = urlObj.toString()

        switch (format) {
            case 'curl':
                let curl = `curl -X ${method} "${finalUrl}"`
                Object.entries(headers).forEach(([k, v]) => curl += ` \\\n  -H "${k}: ${v}"`)
                if (body && method !== 'GET') {
                    curl += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`
                }
                return curl

            case 'fetch':
                const fetchOptions = {
                    method,
                    headers,
                    ...(body && method !== 'GET' ? { body: body.startsWith('{') ? `JSON.stringify(${body})` : body } : {})
                }
                return `fetch("${finalUrl}", ${JSON.stringify(fetchOptions, null, 2).replace(/"JSON.stringify\((.*?)\)"/g, 'JSON.stringify($1)')});`

            case 'python':
                let py = `import requests\n\nurl = "${finalUrl}"\n`
                if (Object.keys(headers).length > 0) py += `headers = ${JSON.stringify(headers, null, 4)}\n`
                if (body && method !== 'GET') {
                    if (headers['Content-Type'] === 'application/json') py += `data = ${body}\nresponse = requests.${method.toLowerCase()}(url, headers=headers, json=data)`
                    else py += `data = """${body}"""\nresponse = requests.${method.toLowerCase()}(url, headers=headers, data=data)`
                } else {
                    py += `response = requests.${method.toLowerCase()}(url${Object.keys(headers).length > 0 ? ', headers=headers' : ''})`
                }
                py += `\n\nprint(response.status_code)\nprint(response.json())`
                return py

            default: return ''
        }
    }

    const handleCopy = () => {
        const code = generateCode(selectedFormat)
        navigator.clipboard.writeText(code)
        setCopyFeedback(true)
        setTimeout(() => setCopyFeedback(false), 2000)
    }

    return (
        <div
            style={{
                background: '#1f2937',
                color: '#ffffff',
                borderRadius: 12,
                minWidth: 320,
                border: '1px solid #374151',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    padding: '10px 14px',
                    background: '#111827',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTopLeftRadius: 11,
                    borderTopRightRadius: 11,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{data.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8, marginRight: 8 }}>
                        <button
                            className="nodrag"
                            onClick={() => setIsImporting(true)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#3b82f6',
                                fontSize: '10px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                opacity: 0.8
                            }}
                        >
                            <span>⚡ IMPORT</span>
                        </button>
                        <button
                            className="nodrag"
                            onClick={() => setIsExportingCode(true)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#10b981',
                                fontSize: '10px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                opacity: 0.8
                            }}
                        >
                            <span>📂 CODE</span>
                        </button>
                    </div>
                    <button
                        className="nodrag"
                        onClick={handleDelete}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '18px',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* CURL IMPORT UI Overlay-style */}
            {isImporting && (
                <div style={{ padding: '10px', background: '#111827', borderBottom: '1px solid #374151' }}>
                    <textarea
                        className="nodrag"
                        placeholder="Paste curl command here..."
                        value={curlInput}
                        onChange={(e) => setCurlInput(e.target.value)}
                        style={{
                            width: '100%',
                            height: '80px',
                            background: '#1f2937',
                            border: '1px solid #4b5563',
                            color: '#fff',
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            marginBottom: '8px',
                            outline: 'none',
                            resize: 'none'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="nodrag" onClick={handleImportCurl} style={{ flex: 1, background: '#3b82f6', border: 'none', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Import</button>
                        <button className="nodrag" onClick={() => setIsImporting(false)} style={{ background: '#374151', border: 'none', color: '#9ca3af', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* BODY CONTENT */}
            <div style={{ padding: '12px 0' }}>
                {/* Method & URL Row */}
                <div style={{ position: 'relative', width: '100%', padding: '0 14px 12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select
                            className="nodrag"
                            value={currentMethod}
                            onChange={(e) => handleInputChange('method', e.target.value)}
                            style={{ background: '#374151', border: '1px solid #4b5563', color: '#fff', padding: '6px 8px', borderRadius: 6, fontSize: 12, outline: 'none', cursor: 'pointer' }}
                        >
                            {Object.keys(METHOD_COLORS).map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="https://api.example.com"
                            className="nodrag"
                            value={urlInput?.value || ''}
                            onChange={(e) => handleInputChange('url', e.target.value)}
                            style={{ flex: 1, background: '#111827', border: '1px solid #4b5563', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12, outline: 'none' }}
                        />
                    </div>
                    {/* Input Handle for Method/URL (on the left border) */}
                    <Handle
                        id="method"
                        type="target"
                        position={Position.Left}
                        style={{ left: -7, top: '50%', transform: 'translateY(-50%)', background: PIN_COLORS.string, width: 14, height: 14, zIndex: 1000, border: '2px solid #1f2937', cursor: 'crosshair' }}
                    />
                </div>

                {/* Other Inputs (Params, Headers, Body) */}
                {dataInputs.filter(i => !['url', 'method'].includes(i.id)).map((input) => (
                    <div key={input.id} style={{ position: 'relative', width: '100%', padding: '0 14px 10px 14px' }}>
                        <label style={{ fontSize: 10, color: '#9ca3af', display: 'block', marginBottom: 4 }}>{input.label}</label>
                        <textarea
                            className="nodrag"
                            value={input.value || ''}
                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                            placeholder={`{ }`}
                            style={{ width: '100%', minHeight: 40, background: '#111827', border: '1px solid #4b5563', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace', outline: 'none', resize: 'vertical' }}
                        />
                        <Handle
                            id={input.id}
                            type="target"
                            position={Position.Left}
                            style={{ left: -7, top: '50%', transform: 'translateY(-50%)', background: PIN_COLORS[input.type] || PIN_COLORS.any, width: 14, height: 14, zIndex: 1000, border: '2px solid #1f2937', cursor: 'crosshair' }}
                        />
                    </div>
                ))}

                {/* Outputs Section */}
                <div style={{ borderTop: '1px solid #374151', marginTop: 4, background: '#11182750', padding: '8px 0' }}>
                    {dataOutputs.map(output => (
                        <div key={output.id} style={{ position: 'relative', width: '100%', padding: '4px 14px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{output.label}</span>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIN_COLORS[output.type] || PIN_COLORS.any }} />
                            <Handle
                                id={output.id}
                                type="source"
                                position={Position.Right}
                                style={{ right: -7, top: '50%', transform: 'translateY(-50%)', background: PIN_COLORS[output.type] || PIN_COLORS.any, width: 14, height: 14, zIndex: 1000, border: '2px solid #1f2937', cursor: 'crosshair' }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* CODE EXPORT OVERLAY */}
            {isExportingCode && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(17, 24, 39, 0.95)',
                    zIndex: 2000,
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Export Code</span>
                        <button className="nodrag" onClick={() => setIsExportingCode(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer' }}>×</button>
                    </div>

                    <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: '#1f2937', padding: 2, borderRadius: 6 }}>
                        {['curl', 'fetch', 'python'].map(f => (
                            <button
                                key={f}
                                className="nodrag"
                                onClick={() => setSelectedFormat(f)}
                                style={{
                                    flex: 1,
                                    background: selectedFormat === f ? '#374151' : 'transparent',
                                    border: 'none',
                                    color: selectedFormat === f ? '#fff' : '#9ca3af',
                                    padding: '6px',
                                    borderRadius: 4,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        <pre style={{
                            margin: 0,
                            padding: '12px',
                            background: '#111827',
                            borderRadius: 8,
                            fontSize: 11,
                            fontFamily: 'monospace',
                            color: '#d1d5db',
                            overflow: 'auto',
                            height: '100%',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            border: '1px solid #374151'
                        }}>
                            {generateCode(selectedFormat)}
                        </pre>
                        <button
                            className="nodrag"
                            onClick={handleCopy}
                            style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                background: copyFeedback ? '#10b981' : '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {copyFeedback ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>
            )}

            {/* EXEC HANDLES (Absolute positioned relative to node) */}
            <Handle
                id="exec-in"
                type="target"
                position={Position.Left}
                style={{ left: -9, top: 18, background: '#fff', width: 18, height: 18, zIndex: 1001, border: '4px solid #111827', cursor: 'crosshair' }}
            />
            <Handle
                id="exec-out"
                type="source"
                position={Position.Right}
                style={{ right: -9, top: 18, background: '#fff', width: 18, height: 18, zIndex: 1001, border: '4px solid #111827', cursor: 'crosshair' }}
            />
        </div>
    )
}
