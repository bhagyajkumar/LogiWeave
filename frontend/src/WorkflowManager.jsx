import { useState, useEffect } from 'react'
import { Button } from 'react-bootstrap'

export default function WorkflowManager({ onLoad, currentNodes, currentEdges }) {
    const [workflows, setWorkflows] = useState([])
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [workflowName, setWorkflowName] = useState('')

    useEffect(() => {
        loadWorkflows()
    }, [])

    const loadWorkflows = () => {
        const saved = localStorage.getItem('logiweave_workflows')
        setWorkflows(saved ? JSON.parse(saved) : [])
    }

    const saveWorkflow = () => {
        if (!workflowName.trim()) {
            alert('Please enter a workflow name')
            return
        }

        const newWorkflow = {
            id: crypto.randomUUID(),
            name: workflowName,
            timestamp: new Date().toISOString(),
            nodes: currentNodes,
            edges: currentEdges
        }

        const updated = [...workflows, newWorkflow]
        localStorage.setItem('logiweave_workflows', JSON.stringify(updated))
        setWorkflows(updated)
        setWorkflowName('')
        setShowSaveDialog(false)
    }

    const deleteWorkflow = (id) => {
        if (!confirm('Delete this workflow?')) return
        const updated = workflows.filter(w => w.id !== id)
        localStorage.setItem('logiweave_workflows', JSON.stringify(updated))
        setWorkflows(updated)
    }

    const formatDate = (iso) => {
        return new Date(iso).toLocaleString()
    }

    return (
        <div style={{
            padding: '20px',
            background: '#0f172a',
            minHeight: '100vh',
            color: '#fff'
        }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                    <h2 style={{ margin: 0 }}>Saved Workflows</h2>
                    <Button
                        onClick={() => setShowSaveDialog(true)}
                        style={{
                            background: '#3b82f6',
                            border: 'none',
                            padding: '8px 16px'
                        }}
                    >
                        💾 Save Current
                    </Button>
                </div>

                {showSaveDialog && (
                    <div style={{
                        background: '#1e293b',
                        padding: 20,
                        borderRadius: 8,
                        marginBottom: 20,
                        border: '1px solid #334155'
                    }}>
                        <h4>Save Workflow</h4>
                        <input
                            type="text"
                            placeholder="Workflow name..."
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveWorkflow()}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: 4,
                                color: '#fff',
                                marginBottom: 10
                            }}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <Button onClick={saveWorkflow} style={{ background: '#10b981', border: 'none' }}>
                                Save
                            </Button>
                            <Button onClick={() => setShowSaveDialog(false)} variant="secondary">
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {workflows.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 60,
                        background: '#1e293b',
                        borderRadius: 8,
                        color: '#94a3b8'
                    }}>
                        <p>No saved workflows yet.</p>
                        <p>Click "Save Current" to save your first workflow!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {workflows.map(workflow => (
                            <div
                                key={workflow.id}
                                style={{
                                    background: '#1e293b',
                                    padding: 16,
                                    borderRadius: 8,
                                    border: '1px solid #334155',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0' }}>{workflow.name}</h4>
                                    <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                                        {formatDate(workflow.timestamp)} • {workflow.nodes.length} nodes
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <Button
                                        size="sm"
                                        onClick={() => onLoad(workflow)}
                                        style={{ background: '#3b82f6', border: 'none' }}
                                    >
                                        Load
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => deleteWorkflow(workflow.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
