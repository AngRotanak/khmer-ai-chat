export const sanitizeCanvas = <T>(input: T): T => {
  const clean = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(clean).filter(item => item !== undefined)
    }
    if (obj && typeof obj === 'object') {
      const result: any = {}
      for (const key in obj) {
        const value = obj[key]
        if (value !== undefined) {
          result[key] = clean(value)
        }
      }
      return result
    }
    return obj
  }

  return clean(input)
}
