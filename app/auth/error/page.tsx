'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Building2, AlertCircle } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const [errorInfo, setErrorInfo] = useState<{
    error: string | null
    errorCode: string | null
    errorDescription: string | null
  }>({
    error: null,
    errorCode: null,
    errorDescription: null,
  })

  useEffect(() => {
    // Check URL search params first
    let error = searchParams.get('error')
    let errorCode = searchParams.get('error_code')
    let errorDescription = searchParams.get('error_description')

    // Also check the hash fragment (Supabase sometimes puts errors there)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      error = error || hashParams.get('error')
      errorCode = errorCode || hashParams.get('error_code')
      errorDescription = errorDescription || hashParams.get('error_description')
    }

    setErrorInfo({ error, errorCode, errorDescription })
  }, [searchParams])

  const getErrorMessage = () => {
    if (errorInfo.errorDescription) {
      return errorInfo.errorDescription.replace(/\+/g, ' ')
    }
    
    switch (errorInfo.errorCode) {
      case 'otp_expired':
        return 'The email link has expired. Please request a new one.'
      case 'access_denied':
        return 'Access was denied. Please try again.'
      case 'invalid_request':
        return 'Invalid request. Please try signing up again.'
      default:
        return errorInfo.error || 'An authentication error occurred. Please try again.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              <span className="font-bold text-xl">Hall 16</span>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            Something went wrong during authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error{errorInfo.errorCode ? `: ${errorInfo.errorCode}` : ''}</AlertTitle>
            <AlertDescription>{getErrorMessage()}</AlertDescription>
          </Alert>

          {errorInfo.errorCode === 'otp_expired' && (
            <p className="text-sm text-muted-foreground text-center">
              Email confirmation links expire after a short time for security reasons. 
              Please sign up again to receive a new confirmation email.
            </p>
          )}

          <div className="space-y-2">
            <Link href="/auth/sign-up">
              <Button className="w-full">
                Sign Up Again
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Go to Login
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
