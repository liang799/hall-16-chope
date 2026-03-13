import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
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
          <p className="text-muted-foreground">
            Please try signing in again. If the problem persists, contact support.
          </p>

          <div className="space-y-2">
            <Link href="/auth/login">
              <Button className="w-full">
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
