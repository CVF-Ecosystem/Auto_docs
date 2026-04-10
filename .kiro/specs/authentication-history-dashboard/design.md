# Design Document: Authentication, History & Dashboard

## Overview

This design document specifies the technical implementation for adding authentication, authorization, document history viewing, and dashboard statistics to the Auto Docs AI Document Generator. The system will use NextAuth.js v4 with JWT sessions for authentication, Next.js middleware for route protection and optional IP whitelisting, and server-side data fetching for the history page and dashboard.

The implementation builds upon the existing Next.js 16 App Router architecture with Prisma ORM, PostgreSQL database, and React Server Components. All new features will follow the established patterns in the codebase while adding minimal dependencies.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Login Page │  │ History Page │  │ Dashboard Page   │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Middleware                        │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ IP Whitelist     │  │ Session Validation           │   │
│  │ Check (optional) │→ │ (JWT verification)           │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NextAuth.js Layer                         │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ Credentials      │  │ JWT Session                  │   │
│  │ Provider         │  │ Strategy                     │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ Auth API Routes  │  │ Protected Routes             │   │
│  │ /api/auth/*      │  │ /documents, /api/*           │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ Prisma Client    │  │ PostgreSQL Database          │   │
│  │ (User, Document) │  │ (Users, Documents, etc.)     │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User → Login Page → Submit Credentials
                         │
                         ▼
              NextAuth Credentials Provider
                         │
                         ├─→ Validate against env vars (NEXTAUTH_CREDENTIALS)
                         │   OR
                         └─→ Validate against User table in database
                         │
                         ▼
                    Generate JWT Token
                         │
                         ├─→ Success: Set session cookie, redirect to dashboard
                         └─→ Failure: Return error message
```

### Request Protection Flow

```
Incoming Request
      │
      ▼
Next.js Middleware
      │
      ├─→ Check if route is protected
      │   (matches /api/* or /(dashboard)/*)
      │
      ├─→ If ALLOWED_IPS is set:
      │   └─→ Extract client IP
      │       └─→ Check against whitelist
      │           ├─→ Not in list: Return 403
      │           └─→ In list: Continue
      │
      ├─→ Check session (JWT validation)
      │   ├─→ No session: Redirect to /login
      │   └─→ Valid session: Continue
      │
      ▼
Route Handler / Page Component
```

## Components and Interfaces

### 1. Authentication Configuration

**File:** `src/lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export interface AuthUser {
  id: string
  name: string
  role: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Implementation details in section below
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to JWT
    },
    async session({ session, token }) {
      // Add user info to session
    }
  }
}
```

**Credential Validation Logic:**

The `authorize` function will support two modes:

1. **Environment Variable Mode** (for simple deployments):
   - Read `NEXTAUTH_CREDENTIALS` in format: `username:hashedpassword,username2:hashedpassword2`
   - Parse and validate against provided credentials
   - Use bcrypt to compare passwords

2. **Database Mode** (for production):
   - Query User table for matching username
   - Compare hashed password using bcrypt
   - Return user object if valid

### 2. NextAuth API Route

**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

This follows Next.js 16 App Router conventions for API routes.

### 3. Middleware for Route Protection

**File:** `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip auth routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  // Check IP whitelist if configured
  const allowedIps = process.env.ALLOWED_IPS
  if (allowedIps) {
    const clientIp = extractClientIp(request)
    const ipList = allowedIps.split(',').map(ip => ip.trim())
    
    if (!ipList.includes(clientIp)) {
      return new NextResponse('Access denied: IP not allowed', { status: 403 })
    }
  }
  
  // Check authentication for protected routes
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

function extractClientIp(request: NextRequest): string {
  // Extract from X-Forwarded-For header or socket
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.ip || 'unknown'
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
```

### 4. Login Page Component

**File:** `src/app/(auth)/login/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng')
      } else {
        router.push(callbackUrl)
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng kiểm tra mạng.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    // UI implementation
  )
}
```

**UI Structure:**
- Centered card layout with max-width 400px
- Username input field (text)
- Password input field (password type)
- Submit button with loading spinner
- Error message display area
- Responsive design with Tailwind CSS
- Mobile-optimized with full-width inputs on small screens

### 5. Document History Page

**File:** `src/app/(dashboard)/documents/page.tsx`

This will be a Server Component that fetches data server-side:

```typescript
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DocumentTable } from '@/components/documents/DocumentTable'
import { DocumentFilters } from '@/components/documents/DocumentFilters'
import { Pagination } from '@/components/documents/Pagination'

interface SearchParams {
  page?: string
  templateId?: string
  status?: string
  startDate?: string
  endDate?: string
}

export default async function DocumentsPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)
  
  // Parse query parameters
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20
  const skip = (page - 1) * pageSize
  
  // Build filter conditions
  const where: any = {
    userId: session?.user?.id
  }
  
  if (searchParams.templateId) {
    where.templateId = searchParams.templateId
  }
  
  if (searchParams.status && searchParams.status !== 'all') {
    where.status = searchParams.status
  }
  
  if (searchParams.startDate || searchParams.endDate) {
    where.createdAt = {}
    if (searchParams.startDate) {
      where.createdAt.gte = new Date(searchParams.startDate)
    }
    if (searchParams.endDate) {
      where.createdAt.lte = new Date(searchParams.endDate)
    }
  }
  
  // Fetch documents and count
  const [documents, totalCount, templates] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        template: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    }),
    prisma.document.count({ where }),
    prisma.template.findMany({
      where: { status: 'active' },
      select: { id: true, name: true }
    })
  ])
  
  const totalPages = Math.ceil(totalCount / pageSize)
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Lịch sử tài liệu</h1>
      
      <DocumentFilters 
        templates={templates}
        currentFilters={searchParams}
      />
      
      <DocumentTable documents={documents} />
      
      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/documents"
      />
    </div>
  )
}
```

### 6. Dashboard Page

**File:** `src/app/(dashboard)/page.tsx`

```typescript
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentDocuments } from '@/components/dashboard/RecentDocuments'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  // Fetch statistics
  const [totalDocs, todayDocs, totalTemplates, recentDocs] = await Promise.all([
    prisma.document.count({
      where: { userId: session?.user?.id }
    }),
    prisma.document.count({
      where: {
        userId: session?.user?.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.template.count({
      where: { status: 'active' }
    }),
    prisma.document.findMany({
      where: { userId: session?.user?.id },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link 
          href="/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tạo tài liệu mới
        </Link>
      </div>
      
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard 
          label="Tổng số tài liệu"
          value={totalDocs}
          icon="📄"
        />
        <StatsCard 
          label="Tài liệu hôm nay"
          value={todayDocs}
          icon="📅"
        />
        <StatsCard 
          label="Templates khả dụng"
          value={totalTemplates}
          icon="📋"
        />
      </div>
      
      {/* Recent Documents */}
      <RecentDocuments documents={recentDocs} />
    </div>
  )
}
```

## Data Models

The existing Prisma schema already includes the necessary models. No schema changes are required:

```prisma
model User {
  id         String     @id @default(cuid())
  name       String
  department String?
  role       String     @default("user")
  ocrMode    String     @default("gemini")
  documents  Document[]
  createdAt  DateTime   @default(now())
}

model Document {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  templateId   String
  template     Template @relation(fields: [templateId], references: [id])
  inputType    String
  inputText    String?
  inputFile    String?
  parsedJson   Json?
  docLink      String?
  status       String   @default("draft")
  ocrEngine    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Note:** For authentication, we'll add a `password` field to the User model:

```prisma
model User {
  id         String     @id @default(cuid())
  name       String
  username   String     @unique  // NEW
  password   String              // NEW (hashed with bcrypt)
  department String?
  role       String     @default("user")
  ocrMode    String     @default("gemini")
  documents  Document[]
  createdAt  DateTime   @default(now())
}
```

This requires a new migration:

```bash
npx prisma migrate dev --name add_user_credentials
```

## Error Handling

### Authentication Errors

1. **Invalid Credentials**
   - Error: "Tên đăng nhập hoặc mật khẩu không đúng"
   - HTTP Status: 401
   - Display: Red error message on login page

2. **Network Error**
   - Error: "Lỗi kết nối. Vui lòng kiểm tra mạng."
   - Display: Red error message with retry option

3. **Session Expired**
   - Behavior: Automatic redirect to login with callback URL
   - Message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."

4. **IP Not Allowed**
   - HTTP Status: 403
   - Message: "Access denied: IP not allowed"
   - Display: Full-page error message

### Data Loading Errors

1. **Database Connection Failure**
   - Error: "Không thể tải dữ liệu. Vui lòng thử lại."
   - Display: Error banner with retry button
   - Retry: Re-fetch data on button click

2. **Query Timeout**
   - Fallback: Show cached data if available
   - Display: Warning message about stale data

3. **No Data Available**
   - Message: "Chưa có tài liệu nào"
   - Display: Empty state with "Create Document" CTA

### Error Boundary

Implement a global error boundary for unexpected errors:

```typescript
// src/app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Đã xảy ra lỗi</h2>
        <p className="text-gray-600 mb-4">Vui lòng thử lại sau.</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Thử lại
        </button>
      </div>
    </div>
  )
}
```

## Testing Strategy

### Why Property-Based Testing Does Not Apply

This feature is **not suitable for property-based testing** because it primarily involves:

1. **UI Rendering** - Login page, history page, dashboard (use snapshot tests and visual regression tests)
2. **Simple CRUD Operations** - Database reads/writes with no complex transformation logic (use example-based unit tests)
3. **Configuration Validation** - Environment variable checks (use schema validation and example-based tests)
4. **Side-Effect Operations** - Session creation, redirects, cookie setting (use mock-based unit tests)
5. **Integration with External Systems** - NextAuth.js, Prisma ORM (use integration tests)

The feature does not have universal properties that hold across a wide input space. Instead, it has specific behaviors that should be tested with concrete examples.

### Testing Approach

We will use a combination of:
- **Unit tests** for isolated logic (credential validation, IP parsing, filter construction)
- **Integration tests** for workflows (login flow, route protection, data fetching)
- **End-to-end tests** for complete user journeys
- **Snapshot tests** for UI components

### Unit Tests

1. **Authentication Logic**
   - Test credential validation against env vars with valid/invalid credentials
   - Test credential validation against database with existing/non-existing users
   - Test bcrypt password comparison with correct/incorrect passwords
   - Test JWT token generation includes correct user data
   - Test JWT token validation rejects expired/malformed tokens

2. **Middleware Logic**
   - Test IP extraction from X-Forwarded-For header
   - Test IP extraction from request socket when header absent
   - Test IP whitelist validation with allowed/blocked IPs
   - Test session validation with valid/invalid/expired tokens
   - Test redirect URL construction preserves original path

3. **Data Fetching**
   - Test filter query construction with various filter combinations
   - Test pagination calculations for edge cases (page 1, last page, empty results)
   - Test date range filtering with various date combinations

4. **Utility Functions**
   - Test date formatting functions
   - Test relative time display ("2 hours ago", "3 days ago")
   - Test status badge color mapping

### Integration Tests

1. **Login Flow**
   - Submit valid credentials → redirect to dashboard
   - Submit invalid credentials → show error message
   - Login with callback URL → redirect to original page

2. **Route Protection**
   - Access protected route without session → redirect to login
   - Access protected route with valid session → allow access
   - Access from non-whitelisted IP → return 403

3. **History Page**
   - Load documents with pagination
   - Apply filters and verify results
   - Navigate between pages

4. **Dashboard**
   - Load statistics correctly
   - Display recent documents
   - Navigate to document creation

### End-to-End Tests

1. **Complete Authentication Flow**
   - Login → view dashboard → view history → logout

2. **Document Management Flow**
   - Login → create document → view in history → view on dashboard

3. **Mobile Responsiveness**
   - Test all pages on mobile viewport
   - Verify touch targets are adequate
   - Verify horizontal scrolling works

## Deployment Considerations

### Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auto_docs"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# Authentication Mode 1: Hardcoded credentials (for simple deployments)
NEXTAUTH_CREDENTIALS="admin:$2a$10$hashedpassword,user:$2a$10$hashedpassword2"

# Authentication Mode 2: Database (leave NEXTAUTH_CREDENTIALS empty)
# Users will be read from User table

# Optional: IP Whitelist
ALLOWED_IPS="192.168.1.1,10.0.0.1"

# Existing variables
GEMINI_API_KEY="..."
GAS_WEBHOOK_URL="..."
```

### Password Hashing

For generating hashed passwords for `NEXTAUTH_CREDENTIALS`:

```bash
npm install -g bcryptjs
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10))"
```

### Database Migration

Before deployment:

```bash
npx prisma migrate deploy
```

### Security Checklist

- [ ] NEXTAUTH_SECRET is set to a strong random value
- [ ] Passwords are hashed with bcrypt (cost factor 10)
- [ ] JWT tokens expire after 30 days
- [ ] HTTPS is enabled in production
- [ ] NEXTAUTH_URL matches production domain
- [ ] IP whitelist is configured if needed
- [ ] Database credentials are not exposed
- [ ] Session cookies are httpOnly and secure

### Performance Optimization

1. **Database Queries**
   - Use Prisma's `include` to fetch related data in single query
   - Add indexes on frequently queried fields (userId, createdAt, status)
   - Use pagination to limit result sets

2. **Server Components**
   - Leverage React Server Components for data fetching
   - Reduce client-side JavaScript bundle size
   - Stream data with Suspense boundaries

3. **Caching**
   - Cache template list (rarely changes)
   - Use Next.js route cache for static pages
   - Implement stale-while-revalidate for statistics

### Monitoring

1. **Authentication Metrics**
   - Track failed login attempts
   - Monitor session creation rate
   - Alert on unusual IP access patterns

2. **Performance Metrics**
   - Track page load times
   - Monitor database query performance
   - Track API response times

3. **Error Tracking**
   - Log authentication failures
   - Track database connection errors
   - Monitor middleware rejections

## Implementation Phases

### Phase 1: Authentication Foundation (Priority: High)
- Install bcryptjs dependency
- Create auth configuration (`src/lib/auth.ts`)
- Implement NextAuth API route
- Add username/password fields to User model
- Create database migration

### Phase 2: Login Page (Priority: High)
- Create login page component
- Implement form validation
- Add error handling
- Style with Tailwind CSS
- Test mobile responsiveness

### Phase 3: Middleware Protection (Priority: High)
- Implement middleware with session check
- Add IP whitelist logic
- Test route protection
- Handle redirect with callback URL

### Phase 4: Document History (Priority: Medium)
- Create history page component
- Implement server-side data fetching
- Build filter components
- Implement pagination
- Add responsive table design

### Phase 5: Dashboard (Priority: Medium)
- Create dashboard page component
- Implement statistics queries
- Build stats card components
- Add recent documents list
- Implement quick action button

### Phase 6: Polish & Testing (Priority: Low)
- Add loading states
- Implement error boundaries
- Add retry mechanisms
- Write unit tests
- Perform end-to-end testing
- Optimize performance

## Migration Path

For existing deployments without authentication:

1. **Add User Records**
   - Create admin user in database
   - Hash password with bcrypt
   - Assign existing documents to admin user

2. **Enable Authentication**
   - Set NEXTAUTH_SECRET and NEXTAUTH_URL
   - Deploy middleware
   - Test login flow

3. **Optional: Enable IP Whitelist**
   - Set ALLOWED_IPS environment variable
   - Test access from allowed/blocked IPs

4. **Gradual Rollout**
   - Deploy to staging environment first
   - Test all authentication flows
   - Monitor for errors
   - Deploy to production

## Appendix: Component Specifications

### DocumentTable Component

```typescript
interface DocumentTableProps {
  documents: Array<{
    id: string
    inputFile: string | null
    template: { name: string }
    createdAt: Date
    status: string
    docLink: string | null
  }>
}
```

Features:
- Responsive table with horizontal scroll on mobile
- Status badges with color coding (draft: gray, generated: green, error: red)
- Formatted date display (DD/MM/YYYY HH:mm)
- Clickable Google Docs link when available
- Empty state when no documents

### DocumentFilters Component

```typescript
interface DocumentFiltersProps {
  templates: Array<{ id: string; name: string }>
  currentFilters: {
    templateId?: string
    status?: string
    startDate?: string
    endDate?: string
  }
}
```

Features:
- Template dropdown (all templates + "All" option)
- Status dropdown (all, draft, generated, error)
- Date range inputs (start date, end date)
- Clear filters button
- URL-based filter state (search params)

### Pagination Component

```typescript
interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
}
```

Features:
- Previous/Next buttons
- Page number buttons (show 5 pages max, with ellipsis)
- Disabled state for first/last page
- Preserve query parameters when navigating
- Mobile-optimized (show 3 pages on small screens)

### StatsCard Component

```typescript
interface StatsCardProps {
  label: string
  value: number
  icon: string
}
```

Features:
- Large number display
- Descriptive label
- Icon/emoji
- Card styling with border and shadow
- Responsive grid layout

### RecentDocuments Component

```typescript
interface RecentDocumentsProps {
  documents: Array<{
    id: string
    inputFile: string | null
    template: { name: string }
    createdAt: Date
    status: string
    docLink: string | null
  }>
}
```

Features:
- List of 5 most recent documents
- Relative time display ("2 hours ago")
- Clickable Google Docs link
- "View All" link to history page
- Empty state message

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** Ready for Implementation
