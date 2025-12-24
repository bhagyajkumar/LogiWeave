export function createNodeFromTemplate(key, template, position) {
  return {
    id: crypto.randomUUID(),
    type: template.type || 'baseNode',
    position,

    draggable: template.draggable !== false,
    deletable: key !== 'start',

    data: {
      title: template.title,
      deletable: key !== 'start', // 🔥 Pass to component for UI
      dynamicInputs: template.dynamicInputs,
      dynamicOutputs: template.dynamicOutputs, // 🔥 Added

      // 🔥 CRITICAL: inputs must be copied
      inputs: template.inputs
        ? template.inputs.map((input) => ({
          id: input.id,
          type: input.type,
          label: input.label,
          value: input.value, // 🔥 Added
        }))
        : [],

      // 🔥 CRITICAL: outputs must be copied
      outputs: template.outputs
        ? template.outputs.map((output) => ({
          id: output.id,
          type: output.type,
          label: output.label,
          value: output.value, // 🔥 Added
        }))
        : [],
    },
  }
}
