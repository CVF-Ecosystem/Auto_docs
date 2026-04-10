import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

function extractClientIp(request: NextRequest): string {
  // Extract from X-Forwarded-For header
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  // Extract from X-Real-IP header
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  
  // Fallback
  return 'unknown'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip auth routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  // Check IP whitelist if configured
  const allowedIps = process.env.ALLOWED_IPS
  if (allowedIps && allowedIps.trim() !== '') {
    const clientIp = extractClientIp(request)
    const ipList = allowedIps.split(',').map(ip => ip.trim())
    
    if (!ipList.includes(clientIp)) {
      return new NextResponse('Access denied: IP not allowed', { status: 403 })
    }
  }
  
  // Check if route is protected
  const isProtectedRoute = 
    pathname.startsWith('/api/') || 
    pathname.startsWith('/documents') ||
    pathname === '/'
  
  if (isProtectedRoute) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login).*)',
  ]
}
