import { useEffect, useState } from 'react'
import { apiQuote, type Quote } from '../../api/authApi'

function Footer() {
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    let cancelled = false

    apiQuote()
      .then((q) => {
        if (!cancelled) setQuote(q)
      })
      .catch(() => {
        // On laisse le footer vivre sans quote si l'API déconne
        if (!cancelled) setQuote(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <footer className="footer">
      <span className="footer-left">©Malky Dev - 2026</span>

      <span className="footer-right">
        {quote ? (
          <>
            « {quote.content} »{quote.author ? ` — ${quote.author}` : ''}
          </>
        ) : (
          <>« Tout ça n'est qu'une farce. » — le Comédien</>
        )}
      </span>
    </footer>
  )
}

export default Footer