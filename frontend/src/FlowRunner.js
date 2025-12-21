export default class FlowRunner {
    constructor(nodes, edges, logCallback) {
        this.nodes = nodes
        this.edges = edges
        this.log = logCallback || console.log
        this.context = {} // Store node outputs: { nodeId: { outputId: value } }
        this.variables = {} // Store variables: { name: value }
        this.isRunning = false
    }

    async run() {
        this.log('🚀 Starting execution...')
        this.isRunning = true
        this.context = {}
        this.variables = {} // Reset vars on run? Or keep them? Usually reset.
        this.variables = {} // Store variables: { name: value }
        this.returnStack = [] // For loops: allow returning to a node
        this.loopStates = {} // Store loop state: { nodeId: { index, list } }
        this.executionStack = new Set() // For cycle detection

        // 1. Find Start Node
        const startNode = this.nodes.find((n) => n.id === 'start')
        if (!startNode) {
            this.log('❌ Error: No Start node found.')
            return
        }

        // 2. Begin Execution Loop
        let currentNode = startNode
        try {
            while (currentNode && this.isRunning) {
                // this.log(`▶ Executing: ${currentNode.data.title} (${currentNode.id})`)

                // Execute the node's logic
                await this.executeNode(currentNode)

                // Find next node via 'exec-out' -> 'exec-in' edge
                const outgoingEdges = this.edges.filter(e => e.source === currentNode.id)

                // Determine active output handle
                let validHandle = 'exec-out' // Default

                // Special handling for Branch node
                if (currentNode.data.title.toLowerCase() === 'branch') {
                    const result = this.context[currentNode.id]?.condition_result
                    validHandle = result ? 'true' : 'false'
                }
                // Special handling for For Loop
                else if (currentNode.data.title.toLowerCase() === 'for loop') {
                    const state = this.loopStates[currentNode.id]
                    if (state && state.active) {
                        validHandle = 'loopBody'
                        // Push current node to stack to return to it later
                        this.returnStack.push(currentNode)
                    } else {
                        validHandle = 'completed'
                    }
                }

                // Find First VALID execution edge
                const executionEdge = outgoingEdges.find(
                    (e) =>
                        (e.sourceHandle === validHandle || e.sourceHandle === 'exec') &&
                        this.getNode(e.target)
                )

                if (executionEdge) {
                    currentNode = this.getNode(executionEdge.target)
                } else if (this.returnStack.length > 0) {
                    // Return to previous node (e.g. Loop)
                    currentNode = this.returnStack.pop()
                    // this.log(`🔙 Returning to ${currentNode.data.title}`)
                } else {
                    currentNode = null // End of flow
                }
            }
            this.log('✅ Execution completed.')
        } catch (error) {
            this.log(`❌ Error: ${error.message}`)
            console.error(error)
        } finally {
            this.isRunning = false
            this.executionStack.clear()
        }
    }

    getNode(id) {
        return this.nodes.find((n) => n.id === id)
    }

    async getInputValue(node, inputId) {
        // 1. Check if connected via edge
        const edge = this.edges.find(
            (e) => e.target === node.id && e.targetHandle === inputId
        )

        if (edge) {
            const sourceNodeId = edge.source
            const sourceHandleId = edge.sourceHandle
            const sourceNode = this.getNode(sourceNodeId)

            if (sourceNode) {
                // Check if source is "Pure" (no exec inputs)
                // Pure nodes must be re-executed every time to ensure fresh data (e.g. inside loops)
                const isPure = !sourceNode.data.inputs?.some(i => i.type === 'exec')

                // Check if we need to execute (Missing value OR Pure node)
                if (isPure || !this.context[sourceNodeId] || this.context[sourceNodeId][sourceHandleId] === undefined) {
                    // Prevent cycles in recursive pull
                    if (this.executionStack.has(sourceNodeId)) {
                        throw new Error(`Cycle detected at node ${node.data.title}`)
                    }

                    await this.executeNode(sourceNode)
                }
            }

            const sourceOutputs = this.context[sourceNodeId]
            if (sourceOutputs && sourceOutputs[sourceHandleId] !== undefined) {
                return sourceOutputs[sourceHandleId]
            } else {
                return undefined
            }
        }

        // 2. Use manual value
        const inputDef = node.data.inputs.find((i) => i.id === inputId)
        return inputDef ? inputDef.value : undefined // fallback
    }

    async executeNode(node) {
        if (this.executionStack.has(node.id)) return // Already executing in this stack
        this.executionStack.add(node.id)

        try {
            const inputs = {}

            // Resolve all non-exec inputs
            const dataInputs = node.data.inputs.filter(i => i.type !== 'exec')
            for (const input of dataInputs) {
                inputs[input.id] = await this.getInputValue(node, input.id)
            }

            let outputs = {}
            const type = node.data.title.toLowerCase()

            /* --- MATH --- */
            if (type === 'add') {
                outputs['result'] = Number(inputs['a']) + Number(inputs['b'])
            } else if (type === 'subtract') {
                outputs['result'] = Number(inputs['a']) - Number(inputs['b'])
            } else if (type === 'multiply') {
                outputs['result'] = Number(inputs['a']) * Number(inputs['b'])
            } else if (type === 'divide') {
                outputs['result'] = Number(inputs['a']) / Number(inputs['b'])
            }
            /* --- LOGIC --- */
            else if (type === '> (greater than)' || type === 'greater than') { // Handle template title variations
                outputs['result'] = Number(inputs['a']) > Number(inputs['b'])
            } else if (type === '< (less than)' || type === 'less than') {
                outputs['result'] = Number(inputs['a']) < Number(inputs['b'])
            } else if (type === '== (equals)' || type === 'equals') {
                outputs['result'] = inputs['a'] == inputs['b']
            } else if (type === 'and') {
                outputs['result'] = Boolean(inputs['a']) && Boolean(inputs['b'])
            } else if (type === 'or') {
                outputs['result'] = Boolean(inputs['a']) || Boolean(inputs['b'])
            } else if (type === 'not') {
                outputs['result'] = !Boolean(inputs['value'])
            }
            /* --- NETWORK --- */
            else if (type === 'http request') {
                try {
                    const method = (inputs['method'] || 'GET').toUpperCase()
                    const url = inputs['url']
                    // ... rest of http logic
                    const body = inputs['body'] ? JSON.parse(inputs['body']) : undefined
                    const headers = inputs['headers'] ? JSON.parse(inputs['headers']) : {}

                    this.log(`🌐 ${method} ${url}`)

                    const response = await fetch(url, {
                        method,
                        headers,
                        body: method !== 'GET' ? JSON.stringify(body) : undefined
                    })

                    outputs['status'] = response.status
                    const text = await response.text()
                    outputs['response'] = text
                    this.log(`   Status: ${response.status}`)
                } catch (e) {
                    // ...
                    throw e
                }
            }
            /* --- VARIABLES --- */
            else if (type === 'set variable') {
                const name = inputs['name']
                const value = inputs['value']
                if (name) {
                    this.variables[name] = value
                    this.log(`💾 Set '${name}' = ${value}`)
                }
            }
            else if (type === 'get variable') {
                const name = inputs['name']
                if (name) {
                    outputs['value'] = this.variables[name]
                }
            }
            /* --- CONSTANTS --- */
            else if (type === 'number') {
                outputs['value'] = Number(inputs['value'])
            }
            else if (type === 'string') {
                outputs['value'] = String(inputs['value'])
            }
            else if (type === 'boolean') {
                outputs['value'] = Boolean(inputs['value']) === true || inputs['value'] === 'true'
            }
            else if (type === 'list' || type === 'object') {
                try {
                    // If input is already an object (from another node), use it.
                    // If it's a string (manual entry), parse it.
                    const val = inputs['json'] || inputs['value']
                    if (typeof val === 'string') {
                        outputs['value'] = JSON.parse(val)
                    } else {
                        outputs['value'] = val
                    }
                } catch (e) {
                    this.log(`⚠️ Parse Error in ${type}: ${e.message}`)
                    outputs['value'] = null
                }
            }
            /* --- DATA PROCESSING --- */
            else if (type === 'json parse') {
                try {
                    outputs['data'] = JSON.parse(inputs['json'])
                } catch (e) {
                    throw new Error(`Invalid JSON: ${e.message}`)
                }
            }
            else if (type === 'get property') {
                const obj = inputs['object']
                const prop = inputs['property']
                if (obj && prop) {
                    outputs['value'] = obj[prop]
                }
            }
            else if (type === 'pick item') {
                const list = inputs['list']
                const index = Number(inputs['index'])
                if (Array.isArray(list) && !isNaN(index)) {
                    outputs['item'] = list[index]
                }
            }
            else if (type === 'map (pluck)' || type === 'map list') {
                const list = inputs['list']
                const prop = inputs['property']
                if (Array.isArray(list) && prop) {
                    outputs['new_list'] = list.map(item => item[prop])
                }
            }
            /* --- LOOPS --- */
            else if (type === 'for loop') {
                const list = inputs['list'] || []

                // Initialize state if needed
                if (!this.loopStates[node.id]) {
                    this.loopStates[node.id] = { index: 0, list: Array.isArray(list) ? list : [] }
                }

                const state = this.loopStates[node.id]

                if (state.index < state.list.length) {
                    // Continue loop
                    outputs['item'] = state.list[state.index]
                    outputs['index'] = state.index
                    state.active = true

                    // Log ONLY if it's the start (to avoid spam) or debug
                    if (state.index === 0) {
                        this.log(`🔄 Loop Start: ${state.list.length} terms`)
                    }

                    state.index++ // Increment for NEXT visit
                } else {
                    // Loop finished
                    state.active = false
                    // this.log(`🏁 Loop Completed`)
                    delete this.loopStates[node.id] // Cleanup
                }
            }
            /* --- BRANCH --- */
            else if (type === 'branch') {
                const condition = Boolean(inputs['condition'])
                this.log(`🔀 Branch: ${condition}`)
                // Logic to redirect flow? 
                // Branch node usually has two EXEC outputs: 'True' and 'False'
                // We need to set a flag or handle edge traversal specially for Branch
                // But edge traversal is in `run()`.
                // Hack: store the choice in context/output so run() can see it?
                // Or better: `run()` checks output of Branch
                outputs['condition_result'] = condition
            }
            /* --- UTILS --- */
            else if (type === 'print' || type === 'log') {
                const val = inputs['text'] || inputs['value'] || inputs['message']
                this.log(`🖨️ ${val}`)
                outputs['output'] = val
            }

            if (Object.keys(outputs).length > 0) {
                console.log(`[${node.id}] Result:`, outputs)
            }

            this.context[node.id] = outputs
        } finally {
            this.executionStack.delete(node.id)
        }
    }
}
