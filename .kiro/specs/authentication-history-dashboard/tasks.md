# Implementation Plan: Authentication, History & Dashboard

## Overview

This implementation plan breaks down the authentication, authorization, document history, and dashboard features into discrete coding tasks. The implementation uses NextAuth.js v4 with JWT sessions, Next.js middleware for route protection, and React Server Components for data fetching. Each task builds incrementally on previous work, with checkpoints to ensure stability.

## Tasks

- [x] 1. Set up authentication foundation
  - Install bcryptjs and next-auth dependencies
  - Add username and password fields to User model in Prisma schema
  - Create and run database migration for user credentials
  - Create Prisma client singleton if not exists
  - _Requirements: 1.1, 1.5, 14.1, 14.2_

- [x] 2. Implement NextAuth configuration
  - [x] 2.1 Create auth configuration module
    - Create `src/lib/auth.ts` with NextAuthOptions configuration
    - Implement credentials provider with username/password fields
    - Configure JWT session strategy with 30-day expiration
    - Add JWT and session callbacks to include user data
    - _Requirements: 1.1, 1.2, 1.3, 11.1, 11.4_

  - [x] 2.2 Implement credential validation logic
    - Add support for NEXTAUTH_CREDENTIALS environment variable validation
    - Implement bcrypt password comparison for env-based auth
    - Add database query validation against User table
    - Return AuthUser object with id, name, and role on success
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 14.3, 14.7_

  - [x] 2.3 Create NextAuth API route
    - Create `src/app/api/auth/[...nextauth]/route.ts`
    - Export GET and POST handlers using NextAuth
    - Configure signIn page to `/login`
    - _Requirements: 1.1, 1.8_

- [x] 3. Build login page
  - [x] 3.1 Create login page component
    - Create `src/app/(auth)/login/page.tsx` as client component
    - Implement form with username and password inputs
    - Add submit button labeled "Đăng nhập"
    - Extract callbackUrl from search params for redirect
    - _Requirements: 2.1, 2.2, 2.7_

  - [x] 3.2 Implement authentication flow
    - Call signIn from next-auth/react on form submit
    - Show loading indicator during authentication
    - Display error message on authentication failure
    - Redirect to callbackUrl on success
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 13.2, 13.3, 13.4_

  - [x] 3.3 Style login page with responsive design
    - Create centered card layout with max-width 400px
    - Style inputs and button with Tailwind CSS
    - Make inputs full-width on mobile (viewport < 768px)
    - Ensure touch targets are adequate for mobile
    - _Requirements: 2.8, 12.1_

- [x] 4. Checkpoint - Test authentication
  - Ensure login with valid credentials redirects to dashboard
  - Ensure login with invalid credentials shows error message
  - Ensure all tests pass, ask the user if questions arise

- [x] 5. Implement middleware for route protection
  - [x] 5.1 Create middleware with session validation
    - Create `src/middleware.ts` in project root
    - Use getToken from next-auth/jwt to validate session
    - Redirect unauthenticated users to `/login` with callbackUrl
    - Allow authenticated users to proceed to protected routes
    - Skip middleware for `/api/auth/*` routes
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7, 11.3, 11.5_

  - [x] 5.2 Add IP whitelist protection
    - Read ALLOWED_IPS environment variable
    - Extract client IP from X-Forwarded-For header or request socket
    - Parse comma-separated IP list and validate client IP
    - Return 403 with "Access denied: IP not allowed" if IP not in whitelist
    - Skip IP validation if ALLOWED_IPS is not set
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 14.4_

  - [x] 5.3 Configure middleware matcher
    - Protect all routes matching `/api/*` except `/api/auth/*`
    - Protect all routes matching `/(dashboard)/*`
    - Exclude Next.js static assets and images
    - _Requirements: 3.3, 3.4_

- [x] 6. Implement session management
  - [x] 6.1 Add logout functionality
    - Create logout button component
    - Call signOut from next-auth/react on click
    - Redirect to login page after logout
    - _Requirements: 11.6_

  - [ ]* 6.2 Write unit tests for session logic
    - Test JWT token generation includes correct user data
    - Test JWT token validation rejects expired tokens
    - Test session persistence across page refreshes
    - _Requirements: 11.1, 11.2, 11.4, 11.5_

- [x] 7. Build document history page
  - [x] 7.1 Create history page with server-side data fetching
    - Create `src/app/(dashboard)/documents/page.tsx` as Server Component
    - Use getServerSession to get authenticated user
    - Fetch documents from database with template relation
    - Order documents by createdAt descending
    - Implement pagination with 20 documents per page
    - _Requirements: 5.1, 5.2, 6.1, 6.2_

  - [x] 7.2 Implement filter query construction
    - Parse query parameters for templateId, status, startDate, endDate
    - Build Prisma where clause based on active filters
    - Filter by templateId when template filter is set
    - Filter by status when status filter is not "all"
    - Filter by date range when start/end dates are provided
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

  - [x] 7.3 Create DocumentTable component
    - Create `src/components/documents/DocumentTable.tsx`
    - Display table with columns: filename, template name, created date, status, actions
    - Format createdAt as "DD/MM/YYYY HH:mm"
    - Show status badges with color coding (draft: gray, generated: green, error: red)
    - Display Google Docs link when status is "generated"
    - Add horizontal scrolling on mobile viewports
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7, 12.2_

  - [x] 7.4 Create DocumentFilters component
    - Create `src/components/documents/DocumentFilters.tsx`
    - Add template dropdown with all templates plus "All" option
    - Add status dropdown with options: all, draft, generated, error
    - Add date range inputs for start date and end date
    - Add "Clear Filters" button to reset all filters
    - Stack filter inputs vertically on mobile viewports
    - _Requirements: 7.1, 7.2, 7.3, 7.8, 12.3_

  - [x] 7.5 Create Pagination component
    - Create `src/components/documents/Pagination.tsx`
    - Display page numbers with previous and next buttons
    - Disable previous button on first page
    - Disable next button on last page
    - Highlight current page number
    - Preserve filter parameters when navigating pages
    - Show 3 page numbers on mobile, 5 on desktop
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 12.5_

  - [ ]* 7.6 Write unit tests for filter logic
    - Test filter query construction with various combinations
    - Test pagination calculations for edge cases
    - Test date range filtering with various dates
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

- [x] 8. Checkpoint - Test history page
  - Ensure history page displays documents correctly
  - Ensure filters work and update results
  - Ensure pagination navigates between pages
  - Ensure all tests pass, ask the user if questions arise

- [x] 9. Build dashboard page
  - [x] 9.1 Create dashboard page with statistics
    - Create `src/app/(dashboard)/page.tsx` as Server Component
    - Query total document count for authenticated user
    - Query documents created today count (createdAt >= start of day)
    - Query total active template count
    - Display statistics in responsive grid (3 columns desktop, 1 column mobile)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7, 12.4_

  - [x] 9.2 Create StatsCard component
    - Create `src/components/dashboard/StatsCard.tsx`
    - Display metric value as large number
    - Display descriptive label below value
    - Add icon/emoji for visual interest
    - Style with card layout, padding, and border
    - _Requirements: 8.5, 8.6_

  - [x] 9.3 Create RecentDocuments component
    - Create `src/components/dashboard/RecentDocuments.tsx`
    - Display 5 most recent documents ordered by createdAt descending
    - Show filename, template name, and created date for each document
    - Format createdAt as relative time ("2 hours ago", "3 days ago")
    - Display clickable Google Docs link when status is "generated"
    - Add "View All" link navigating to history page
    - Show "Chưa có tài liệu nào" when no documents exist
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 9.4 Add quick action button
    - Add "Tạo tài liệu mới" button in top-right section
    - Navigate to main document creation page on click
    - Style with primary color background and white text
    - Make button full-width on mobile viewports
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 12.6_

  - [ ]* 9.5 Write unit tests for dashboard logic
    - Test statistics queries return correct counts
    - Test recent documents query returns 5 items max
    - Test relative time formatting function
    - _Requirements: 8.1, 8.2, 8.3, 9.1_

- [x] 10. Implement error handling
  - [x] 10.1 Add error handling to history page
    - Wrap database queries in try-catch blocks
    - Display "Không thể tải dữ liệu. Vui lòng thử lại." on database errors
    - Add retry button that re-fetches data
    - _Requirements: 13.1, 13.5, 13.6_

  - [x] 10.2 Create global error boundary
    - Create `src/app/error.tsx` as error boundary component
    - Display "Đã xảy ra lỗi. Vui lòng thử lại sau." message
    - Add retry button that calls reset function
    - _Requirements: 13.4_

  - [x] 10.3 Add loading states
    - Add loading spinner to login page during authentication
    - Add Suspense boundaries to dashboard and history pages
    - Create loading.tsx files for route segments
    - _Requirements: 2.4_

- [x] 11. Environment configuration and deployment prep
  - [x] 11.1 Document environment variables
    - Update README or create .env.example file
    - Document NEXTAUTH_SECRET, NEXTAUTH_URL, NEXTAUTH_CREDENTIALS
    - Document ALLOWED_IPS for IP whitelist
    - Add instructions for generating bcrypt hashed passwords
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [x] 11.2 Create database migration script
    - Ensure migration adds username and password fields to User model
    - Create seed script to add initial admin user
    - Test migration on clean database
    - _Requirements: 1.5, 1.6, 1.7_

  - [x] 11.3 Add database indexes for performance
    - Add index on User.username for faster lookups
    - Add index on Document.userId for faster filtering
    - Add index on Document.createdAt for faster sorting
    - Add index on Document.status for faster filtering
    - _Requirements: 5.2, 7.4, 7.5, 7.6_

  - [ ]* 11.4 Write integration tests
    - Test complete login flow with valid credentials
    - Test route protection redirects unauthenticated users
    - Test IP whitelist blocks non-whitelisted IPs
    - Test history page loads and filters documents
    - Test dashboard displays correct statistics
    - _Requirements: 1.3, 3.1, 4.4, 5.1, 8.1_

- [x] 12. Final checkpoint and polish
  - [x] 12.1 Test mobile responsiveness
    - Test login page on mobile viewport (< 768px)
    - Test history page with horizontal scrolling
    - Test dashboard with single-column layout
    - Test all touch targets are adequate
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 12.2 Verify security checklist
    - Confirm NEXTAUTH_SECRET is set to strong random value
    - Confirm passwords are hashed with bcrypt cost factor 10
    - Confirm JWT tokens expire after 30 days
    - Confirm session cookies are httpOnly and secure in production
    - _Requirements: 1.5, 11.1_

  - [x] 12.3 Final integration test
    - Test complete user journey: login → dashboard → create document → view history → logout
    - Verify all error messages display correctly
    - Verify all loading states work properly
    - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and catch issues early
- The implementation follows Next.js 16 App Router conventions
- All components use TypeScript for type safety
- Server Components are used for data fetching to reduce client bundle size
- Client Components are used only where interactivity is required (forms, buttons)
