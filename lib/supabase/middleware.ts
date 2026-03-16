import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Simple middleware that just passes through
  // Auth is handled client-side with Supabase
  const response = NextResponse.next({
    request,
  })

  return response
}
