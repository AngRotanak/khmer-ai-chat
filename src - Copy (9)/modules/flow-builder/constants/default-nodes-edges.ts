import type { Edge,  Node } from '@xyflow/react'

export const defaultNodes = []
export const defaultEdges = []

export function sanitizeNodes(raw: Node[] | undefined | null): Node[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .filter(n =>
      n &&
      typeof n.id === 'string' &&
      typeof n.position?.x === 'number' &&
      typeof n.position?.y === 'number' &&
      typeof n.data === 'object'
    )
    .map(n => ({
      ...n,
      draggable: true,
      selectable: true,
    }));
}

export function sanitizeEdges(raw: Edge[] | undefined | null): Edge[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map(e => ({
      ...e,
      id: typeof e.id === 'string' ? e.id : '',
      source: typeof e.source === 'string' ? e.source : '',
      target: typeof e.target === 'string' ? e.target : '',
    }))
    .filter(e => e.id && e.source && e.target);
}



export function sanitize(obj: any): any {
  if (Array.isArray(obj)) {
    return obj
      .map(sanitize)
      .filter(item => item !== undefined)
  }

  if (obj && typeof obj === 'object') {
    const clean: any = {}
    for (const key in obj) {
      const value = obj[key]
      if (value !== undefined) {
        clean[key] = sanitize(value)
      }
    }
    return clean
  }

  return obj
}