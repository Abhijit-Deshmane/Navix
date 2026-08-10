// Swaps `{{ nodeId.path }}` placeholders in a field for values pulled from
// this run's node outputs (keyed by node id). Pure — the caller supplies the
// outputs map. A placeholder that points at nothing becomes "", and one that
// lands on an object/array drops in its JSON so it survives inside text.
export type NodeOutputs = Record<string, unknown>

const PLACEHOLDER = /\{\{\s*([^}]+?)\s*\}\}/g

// Walks a dotted/bracketed path (e.g. `items[0].name`) off the outputs map,
// treating the first segment as the node id. Returns undefined the moment the
// path leaves an object rather than throwing.
function getByPath(root: NodeOutputs, path: string): unknown {
  const keys = path
    .replace(/\[(\w+)\]/g, ".$1") // items[0] -> items.0
    .split(".")
    .filter(Boolean)

  return keys.reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined
    return (acc as Record<string, unknown>)[key]
  }, root)
}

export function interpolate({
  text,
  outputs,
}: {
  text: string
  outputs: NodeOutputs
}): string {
  return text.replace(PLACEHOLDER, (_match, expr: string) => {
    const value = getByPath(outputs, expr.trim())
    if (value == null) return ""
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  })
}