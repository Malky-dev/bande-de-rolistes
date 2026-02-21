export async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/csrf-token', {
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`CSRF endpoint error: ${res.status}`)
  }

  const body = await res.text()

  // Extraction simple du champ JSON "csrfToken"
  // Exemple attendu: {"csrfToken":"..."}
  const match = /"csrfToken"\s*:\s*"([^"]+)"/.exec(body)
  const csrfToken = match?.[1]

  if (typeof csrfToken !== 'string' || csrfToken.length === 0) {
    throw new Error('Invalid CSRF response')
  }

  return csrfToken
}