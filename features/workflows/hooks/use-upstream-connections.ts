import { useMemo } from "react"
import { getIncomers, useStore } from "@xyflow/react"

import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

// One insertable reference to an upstream node's output.
export type UpstreamConnection = {
  // Ready to drop into a field, e.g. "{{ <nodeId>.title }}". Resolved at run
  // time by the interpolate helper against that node's output.
  token: string
  // Human label for a picker, e.g. "Open URL 1 · Title" (node title · output).
  label: string
  // The source node's type, so the caller can render its registry icon.
  nodeType: NodeType
}

// Every output produced by any node upstream of the currently selected node —
// following edges all the way back up the graph, not just direct parents. Reads
// live graph state from the React Flow store, so it re-computes as edges are
// connected and disconnected (and as the selection changes). Nodes already run
// in dependency order, so anything listed here has produced its output by the
// time the selected node runs.
export function useUpstreamConnections(): UpstreamConnection[] {
  // Store arrays are stable references between changes, so selecting them
  // directly is safe (no new array per render, no re-render loop).
  const nodes = useStore((s) => s.nodes) as StepNodeType[]
  const edges = useStore((s) => s.edges)
  const selected = nodes.find((n) => n.selected)

  return useMemo(() => {
    if (!selected) return []

    // Breadth-first walk up the incoming edges, collecting every ancestor once.
    // Nearest ancestors come first, which reads well in a picker.
    const ancestors: StepNodeType[] = []
    const seen = new Set<string>()
    const queue: StepNodeType[] = [selected]

    while (queue.length) {
      const current = queue.shift()!
      for (const incomer of getIncomers(current, nodes, edges) as StepNodeType[]) {
        if (seen.has(incomer.id)) continue
        seen.add(incomer.id)
        ancestors.push(incomer)
        queue.push(incomer)
      }
    }

    return ancestors.flatMap((node) =>
      nodeRegistry[node.data.type].outputs.map((output) => ({
        token: `{{ ${node.id}.${output.path} }}`,
        label: `${node.data.title} · ${output.label}`,
        nodeType: node.data.type,
      }))
    )
  }, [selected, nodes, edges])
}