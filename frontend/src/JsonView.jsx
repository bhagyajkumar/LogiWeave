import React from 'react'
import AceEditor from 'react-ace'

import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-twilight'

export default function JsonView({ nodes, edges, onBack, isPanel = false }) {
    const graphData = {
        nodes,
        edges,
    }

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: '#111827',
                color: '#e5e7eb',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {!isPanel && (
                <div
                    style={{
                        padding: '16px',
                        borderBottom: '1px solid #374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                        Graph JSON Export
                    </h2>
                    <button
                        onClick={onBack}
                        style={{
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        Back to Editor
                    </button>
                </div>
            )}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <AceEditor
                    mode="json"
                    theme="twilight"
                    name="json_editor"
                    value={JSON.stringify(graphData, null, 2)}
                    fontSize={14}
                    showPrintMargin={false}
                    showGutter={true}
                    highlightActiveLine={true}
                    readOnly={true}
                    width="100%"
                    height="100%"
                    setOptions={{
                        useWorker: false,
                        displayIndentGuides: true,
                    }}
                />
            </div>
        </div>
    )
}
