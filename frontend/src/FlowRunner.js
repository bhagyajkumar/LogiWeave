export default class FlowRunner {
    constructor(nodes, edges, logCallback, debugMode = false) {
        this.nodes = nodes
        this.edges = edges
        this.log = logCallback || console.log
        this.debugMode = debugMode
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
                // Exception: Subflow Start nodes are populated by the caller and should not re-execute on pull.
                const isPure = !sourceNode.data.inputs?.some(i => i.type === 'exec') &&
                    sourceNode.data.title.toLowerCase() !== 'subflow start' &&
                    sourceNode.id !== 'start'

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
                    let url = inputs['url']

                    // 1. Handle Query Params
                    const paramsInput = inputs['params']
                    if (paramsInput) {
                        try {
                            const params = typeof paramsInput === 'string' ? JSON.parse(paramsInput) : paramsInput
                            const urlObj = new URL(url)
                            Object.entries(params).forEach(([key, val]) => {
                                urlObj.searchParams.append(key, val)
                            })
                            url = urlObj.toString()
                        } catch (e) {
                            this.log(`⚠️ Query Params Parse Error: ${e.message}`)
                        }
                    }

                    // 2. Handle Headers & Body
                    const bodyInput = inputs['body']
                    const headersInput = inputs['headers']

                    let body = undefined
                    if (method !== 'GET') {
                        body = typeof bodyInput === 'string' ? bodyInput : JSON.stringify(bodyInput)
                    }

                    let headers = {
                        'Content-Type': 'application/json'
                    }
                    if (headersInput) {
                        try {
                            const customHeaders = typeof headersInput === 'string' ? JSON.parse(headersInput) : headersInput
                            headers = { ...headers, ...customHeaders }
                        } catch (e) {
                            this.log(`⚠️ Headers Parse Error: ${e.message}`)
                        }
                    }

                    if (this.debugMode) {
                        this.log(`🌐 ${method} ${url}`)
                    }

                    const response = await fetch(url, {
                        method,
                        headers,
                        body: method !== 'GET' ? body : undefined
                    })

                    // 3. Capture Results
                    outputs['status'] = response.status

                    const responseHeaders = {}
                    response.headers.forEach((v, k) => { responseHeaders[k] = v })
                    outputs['headers'] = responseHeaders

                    const text = await response.text()
                    outputs['response'] = text

                    // 4. Auto-parse JSON for 'data' output
                    try {
                        outputs['data'] = JSON.parse(text)
                    } catch (e) {
                        outputs['data'] = null // Not JSON
                    }

                    if (this.debugMode) {
                        this.log(`   Status: ${response.status}`)
                    }
                } catch (e) {
                    this.log(`❌ HTTP Error: ${e.message}`)
                    throw e
                }
            }
            /* --- VARIABLES --- */
            else if (type === 'set variable') {
                const name = inputs['name']
                const value = inputs['value']
                if (name) {
                    this.variables[name] = value
                    if (this.debugMode) {
                        this.log(`💾 Set '${name}' = ${value}`)
                    }
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
            /* --- STRING OPERATIONS --- */
            else if (type === 'concatenate') {
                const a = String(inputs['a'] || '')
                const b = String(inputs['b'] || '')
                outputs['result'] = a + b
            }
            else if (type === 'split') {
                const text = String(inputs['text'] || '')
                const delimiter = String(inputs['delimiter'] || ',')
                outputs['list'] = text.split(delimiter)
            }
            else if (type === 'replace') {
                const text = String(inputs['text'] || '')
                const search = String(inputs['search'] || '')
                const replace = String(inputs['replace'] || '')
                outputs['result'] = text.replaceAll(search, replace)
            }
            else if (type === 'substring') {
                const text = String(inputs['text'] || '')
                const start = Number(inputs['start']) || 0
                const length = inputs['length'] !== undefined ? Number(inputs['length']) : undefined
                outputs['result'] = length !== undefined ? text.substr(start, length) : text.substring(start)
            }
            else if (type === 'to upper') {
                outputs['result'] = String(inputs['text'] || '').toUpperCase()
            }
            else if (type === 'to lower') {
                outputs['result'] = String(inputs['text'] || '').toLowerCase()
            }
            else if (type === 'trim') {
                outputs['result'] = String(inputs['text'] || '').trim()
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
                        if (this.debugMode) {
                            this.log(`🔄 Loop Start: ${state.list.length} terms`)
                        }
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
                if (this.debugMode) {
                    this.log(`🔀 Branch: ${condition}`)
                }
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
                const val = inputs['text'] !== undefined ? inputs['text'] : (inputs['value'] !== undefined ? inputs['value'] : inputs['message'])
                this.log(`🖨️ ${val}`)
                outputs['output'] = val
            }

            /* --- FLOW --- */
            else if (type === 'subflow start') {
                // Subflow start node acts like a parameter bridge.
                // Its outputs are already populated by the caller (Subflow Call).
                // We must preserve them.
                outputs = this.context[node.id] || {}

                if (this.debugMode) {
                    this.log(`🏁 Subflow Start: ${inputs['name']}`)
                }
            }
            else if (type === 'subflow return') {
                // Subflow return node acts as the end of the subflow.
                // It collects inputs and makes them available to the caller.
                if (this.debugMode) {
                    this.log(`↩ Subflow Return reached`)
                }
                // Store resolved inputs in outputs so they reach this.context
                Object.assign(outputs, inputs)
            }
            else if (type === 'subflow call') {
                const targetName = inputs['name']
                const subflowStartNode = this.nodes.find(n =>
                    n.data.title.toLowerCase() === 'subflow start' &&
                    n.data.inputs.find(i => i.id === 'name')?.value === targetName
                )

                if (!subflowStartNode) {
                    throw new Error(`Subflow not found: ${targetName}`)
                }

                if (this.debugMode) {
                    this.log(`📞 Calling Subflow: ${targetName}`)
                }

                // 1. Prepare subflow inputs (transfer call inputs to start node outputs)
                const subflowContext = {}
                const startOutputs = {}

                // Map call site data inputs to subflow start data outputs by index or name
                // Usually it's better to map by label/id if they match, but here we can try matching by index for simplicity 
                // or just matching the dynamic IDs if they were kept consistent (which they aren't).
                // Let's match by index for data pins (excluding exec).
                const callInputs = node.data.inputs.filter(i => i.type !== 'exec' && i.id !== 'name')
                const startOutputsDef = subflowStartNode.data.outputs.filter(o => o.type !== 'exec')

                for (let i = 0; i < callInputs.length; i++) {
                    const callInputId = callInputs[i].id
                    const value = inputs[callInputId] // Already resolved in executeNode

                    if (startOutputsDef[i]) {
                        startOutputs[startOutputsDef[i].id] = value
                    }
                }

                // Set the context for the subflow start node
                this.context[subflowStartNode.id] = startOutputs

                // 2. Execute Subflow
                let subNode = subflowStartNode
                let subRunning = true
                let lastReturnNode = null

                const firstEdge = this.edges.find(e => e.source === subflowStartNode.id && e.sourceHandle === 'exec')
                if (firstEdge) {
                    subNode = this.getNode(firstEdge.target)
                    while (subNode && subRunning && this.isRunning) {
                        await this.executeNode(subNode)

                        // Check if we hit a return node
                        if (subNode.data.title.toLowerCase() === 'subflow return') {
                            lastReturnNode = subNode
                            subRunning = false
                            break
                        }

                        const outgoingEdges = this.edges.filter(e => e.source === subNode.id)
                        let validHandle = 'exec-out'

                        // Copy-paste simplified logic from run()
                        if (subNode.data.title.toLowerCase() === 'branch') {
                            const result = this.context[subNode.id]?.condition_result
                            validHandle = result ? 'true' : 'false'
                        } else if (subNode.data.title.toLowerCase() === 'for loop') {
                            const state = this.loopStates[subNode.id]
                            if (state && state.active) {
                                validHandle = 'loopBody'
                                this.returnStack.push(subNode)
                            } else {
                                validHandle = 'completed'
                            }
                        }

                        const nextEdge = outgoingEdges.find(e =>
                            (e.sourceHandle === validHandle || e.sourceHandle === 'exec') &&
                            this.getNode(e.target)
                        )

                        if (nextEdge) {
                            subNode = this.getNode(nextEdge.target)
                        } else if (this.returnStack.length > 0) {
                            subNode = this.returnStack.pop()
                        } else {
                            subNode = null // End of subflow
                        }
                    }
                }

                // 3. Map return values back to call site outputs (by index)
                if (lastReturnNode) {
                    const callOutputsDef = node.data.outputs.filter(o => o.type !== 'exec')
                    const returnInputsDef = lastReturnNode.data.inputs.filter(i => i.type !== 'exec')

                    const returnValues = this.context[lastReturnNode.id] || {}
                    const contextOutputs = {}

                    for (let i = 0; i < returnInputsDef.length; i++) {
                        const returnInputId = returnInputsDef[i].id
                        const value = returnValues[returnInputId]

                        if (callOutputsDef[i]) {
                            contextOutputs[callOutputsDef[i].id] = value
                        }
                    }
                    outputs = contextOutputs
                }

                if (this.debugMode) {
                    this.log(`↩ Returned from Subflow: ${targetName}`)
                }
            }

            // Log detailed result to browser console (for debugging)
            if (this.debugMode) {
                console.log(`[${node.id}] Result:`, outputs)
            }

            this.context[node.id] = outputs
        } finally {
            this.executionStack.delete(node.id)
        }
    }
}
