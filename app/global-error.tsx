'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[v0] Global Error:', error)
  }, [error])

  return (
    <html>
      <body>
        <main style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#0a0a0a',
          color: '#fafafa'
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '1px solid #27272a',
            backgroundColor: '#18181b'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Critical Error
            </h1>
            <p style={{ color: '#a1a1aa', marginBottom: '1rem' }}>
              A critical error occurred. The application could not recover.
            </p>
            {error.message && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: '#27272a',
                marginBottom: '1rem',
                wordBreak: 'break-all'
              }}>
                <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#a1a1aa' }}>
                  {error.message}
                </p>
              </div>
            )}
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '1rem' }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: '#fafafa',
                color: '#0a0a0a',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
