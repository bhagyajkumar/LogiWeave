import React, { useState } from 'react'

export default function HttpRequestExport({ data, onClose }) {
    const [selectedFormat, setSelectedFormat] = useState('curl')
    const [copyFeedback, setCopyFeedback] = useState(false)

    const dataInputs = data.inputs?.filter(i => i.type !== 'exec') || []
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

            case 'powershell':
                let ps = `$params = @{\n  Uri = "${finalUrl}"\n  Method = "${method}"\n}`
                if (Object.keys(headers).length > 0) {
                    ps += `\n$params.Headers = @{`
                    Object.entries(headers).forEach(([k, v]) => {
                        ps += `\n  "${k}" = "${v}"`
                    })
                    ps += `\n}`
                }
                if (body && method !== 'GET') {
                    ps += `\n$params.Body = '${body.replace(/'/g, "''")}'`
                    if (headers['Content-Type'] === 'application/json') {
                        ps += `\n$params.ContentType = "application/json"`
                    }
                }
                ps += `\n\nInvoke-RestMethod @params`
                return ps

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
                <button className="nodrag" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: '#1f2937', padding: 2, borderRadius: 6 }}>
                {['curl', 'fetch', 'python', 'powershell'].map(f => (
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
    )
}
