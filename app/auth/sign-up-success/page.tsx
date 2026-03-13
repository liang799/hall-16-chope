import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Mail, CheckCircle } from 'lucide-react'

export default function SignUpSuccessPage() {
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
            <div className="rounded-full bg-emerald-100 p-3">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            {"We've sent you a confirmation link"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="h-5 w-5" />
            <span>Please check your inbox and click the link to verify your account</span>
          </div>

          <div className="space-y-2">
            <Link href="/auth/login">
              <Button className="w-full">
                Go to Login
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
