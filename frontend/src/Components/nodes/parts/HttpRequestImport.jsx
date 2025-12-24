import React, { useState } from 'react'
import { useReactFlow } from 'reactflow'

export default function HttpRequestImport({ id, onClose }) {
    const { setNodes } = useReactFlow()
    const [curlInput, setCurlInput] = useState('')

    const handleImportCurl = () => {
        if (!curlInput.trim()) return

        const curl = curlInput.trim()
        let result = {
            method: 'GET',
            url: '',
            headers: {},
            body: ''
        }

        const urlMatch = curl.match(/(?:^|\s)["']?(https?:\/\/[^"'\s]+)["']?/)
        if (urlMatch) result.url = urlMatch[1]

        const methodMatch = curl.match(/(?:-X|--request)\s+["']?(\w+)["']?/i)
        if (methodMatch) result.method = methodMatch[1].toUpperCase()

        const headerMatches = curl.matchAll(/(?:-H|--header)\s+["']([^"']+)["']/g)
        for (const match of headerMatches) {
            const [key, value] = match[1].split(/:\s*(.*)/)
            if (key && value) result.headers[key.trim()] = value.trim()
        }

        const bodyMatch = curl.match(/(?:-d|--data|--data-raw|--data-binary)\s+["']?(.*?)["']?($|\s+-(?:H|X|A|e|b|c|f|s|S|i|m|y|z|L|k|v|o|p|E|n|T|r|w|q|#))/s)
        if (bodyMatch) result.body = bodyMatch[1]

        if (result.body && result.method === 'GET') result.method = 'POST'

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

        onClose()
    }

    return (
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
                <button className="nodrag" onClick={onClose} style={{ background: '#374151', border: 'none', color: '#9ca3af', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
            </div>
        </div>
    )
}
