export function getCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
    if (!cookieHeader) return undefined
  
    const parts = cookieHeader.split(';')
    for (const part of parts) {
      const [rawKey, ...rawVal] = part.trim().split('=')
      if (rawKey === name) {
        const value = rawVal.join('=')
        try {
          return decodeURIComponent(value)
        } catch {
          return value
        }
      }
    }
  
    return undefined
  }