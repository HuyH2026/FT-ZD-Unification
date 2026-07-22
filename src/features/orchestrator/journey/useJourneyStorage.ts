// src/features/orchestrator/journey/useJourneyStorage.ts
import { useEffect, useState } from 'react'
import { seedFor, type Journey, type JourneyNode, type JourneyEdge } from './journey-data'

export const JOURNEY_KEY = (id: string) => `orchestrator-journey-${id}-v1`

function load(automationId: string): Journey {
  try {
    const raw = window.localStorage?.getItem(JOURNEY_KEY(automationId))
    if (raw) {
      const parsed = JSON.parse(raw) as Journey
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return parsed
    }
  } catch {
    /* ignore missing/malformed storage */
  }
  return seedFor(automationId)
}

export function useJourneyStorage(automationId: string) {
  const [nodes, setNodes] = useState<JourneyNode[]>(() => load(automationId).nodes)
  const [edges, setEdges] = useState<JourneyEdge[]>(() => load(automationId).edges)

  useEffect(() => {
    try {
      window.localStorage?.setItem(JOURNEY_KEY(automationId), JSON.stringify({ nodes, edges }))
    } catch {
      /* ignore quota/unavailable storage */
    }
  }, [automationId, nodes, edges])

  return { nodes, edges, setNodes, setEdges }
}
