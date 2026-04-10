# Requirements Document

## Introduction

This document specifies the requirements for implementing authentication, authorization, document history viewing, and dashboard statistics for the Auto Docs AI Document Generator. The system currently supports file upload, text extraction, OCR, AI parsing, and Google Docs generation. This feature adds user authentication with NextAuth.js, middleware-based route protection with optional IP whitelisting, a paginated document history page with filtering capabilities, and a dashboard with real-time statistics.

## Glossary

- **Auth_System**: The NextAuth.js authentication subsystem responsible for credential validation and session management
- **Middleware**: The Next.js middleware layer that intercepts requests before route handlers execute
- **History_Page**: The user interface component that displays the list of previously created documents
- **Dashboard**: The main landing page that displays statistics and recent activity
- **Session**: A JWT-based authentication token that identifies an authenticated user
- **Document_Record**: A database entry in the Document table representing a generated or draft document
- **IP_Whitelist**: An optional comma-separated list of allowed IP addresses stored in environment variables
- **Filter_Component**: UI elements that allow users to narrow document lists by criteria
- **Pagination_Component**: UI elements that divide large document lists into pages
- **Stats_Widget**: A dashboard component displaying a single metric (count or list)

## Requirements

### Requirement 1: User Authentication

**User Story:** As a system administrator, I want users to authenticate with username and password, so that only authorized personnel can access the document generation system.

#### Acceptance Criteria

1. THE Auth_System SHALL use NextAuth.js with credentials provider for authentication
2. THE Auth_System SHALL use JWT session strategy for session management
3. WHEN a user submits valid credentials, THE Auth_System SHALL create a Session and redirect to the Dashboard
4. WHEN a user submits invalid credentials, THE Auth_System SHALL return an error message and remain on the login page
5. THE Auth_System SHALL hash passwords using bcrypt before storage or comparison
6. WHERE user credentials are stored in environment variables, THE Auth_System SHALL validate against NEXTAUTH_CREDENTIALS environment variable
7. WHERE user credentials are stored in the database, THE Auth_System SHALL query the User table for validation
8. THE Auth_System SHALL generate a NEXTAUTH_SECRET for JWT signing if not provided in environment variables

### Requirement 2: Login Page

**User Story:** As a user, I want a login page where I can enter my credentials, so that I can access the protected application.

#### Acceptance Criteria

1. THE Login_Page SHALL display input fields for username and password
2. THE Login_Page SHALL display a submit button labeled "Đăng nhập"
3. WHEN the submit button is clicked, THE Login_Page SHALL call the Auth_System with provided credentials
4. WHILE authentication is in progress, THE Login_Page SHALL display a loading indicator
5. IF authentication fails, THEN THE Login_Page SHALL display the error message returned by Auth_System
6. WHEN authentication succeeds, THE Login_Page SHALL redirect to the Dashboard
7. THE Login_Page SHALL be accessible at the route `/login`
8. THE Login_Page SHALL be responsive on mobile devices with viewport width less than 768 pixels

### Requirement 3: Route Protection

**User Story:** As a system administrator, I want all dashboard routes protected by authentication, so that unauthenticated users cannot access sensitive functionality.

#### Acceptance Criteria

1. WHEN an unauthenticated user requests a protected route, THE Middleware SHALL redirect to `/login`
2. WHEN an authenticated user requests a protected route, THE Middleware SHALL allow the request to proceed
3. THE Middleware SHALL protect all routes matching the pattern `/api/*` except `/api/auth/*`
4. THE Middleware SHALL protect all routes matching the pattern `/(dashboard)/*`
5. THE Middleware SHALL preserve the original requested URL as a callback parameter during redirect
6. WHEN authentication completes successfully, THE Auth_System SHALL redirect to the preserved callback URL
7. THE Middleware SHALL execute before all route handlers and API endpoints

### Requirement 4: IP Whitelist Protection

**User Story:** As a system administrator, I want optional IP-based access control, so that I can restrict access to specific network locations.

#### Acceptance Criteria

1. WHERE the ALLOWED_IPS environment variable is set, THE Middleware SHALL enforce IP whitelist validation
2. WHERE the ALLOWED_IPS environment variable is empty or undefined, THE Middleware SHALL skip IP whitelist validation
3. WHEN a request originates from an IP address in the IP_Whitelist, THE Middleware SHALL allow the request to proceed to authentication
4. WHEN a request originates from an IP address not in the IP_Whitelist, THE Middleware SHALL return HTTP 403 with message "Access denied: IP not allowed"
5. THE Middleware SHALL extract the client IP address from the X-Forwarded-For header if present
6. THE Middleware SHALL extract the client IP address from the request socket if X-Forwarded-For is not present
7. THE IP_Whitelist SHALL support comma-separated IP addresses in the format "192.168.1.1,10.0.0.1"

### Requirement 5: Document History Display

**User Story:** As a user, I want to view a list of all documents I have created, so that I can track my document generation history.

#### Acceptance Criteria

1. THE History_Page SHALL display a table with columns: filename, template name, created date, status, and actions
2. THE History_Page SHALL retrieve Document_Records from the database ordered by createdAt descending
3. WHEN a Document_Record has status "generated", THE History_Page SHALL display a link to the Google Docs URL
4. WHEN a Document_Record has status "draft", THE History_Page SHALL display a badge with gray background
5. WHEN a Document_Record has status "generated", THE History_Page SHALL display a badge with green background
6. WHEN a Document_Record has status "error", THE History_Page SHALL display a badge with red background
7. THE History_Page SHALL format the createdAt timestamp in the format "DD/MM/YYYY HH:mm"
8. THE History_Page SHALL be accessible at the route `/documents`

### Requirement 6: Document History Pagination

**User Story:** As a user, I want document history divided into pages, so that I can navigate large lists efficiently.

#### Acceptance Criteria

1. THE Pagination_Component SHALL display 20 Document_Records per page
2. THE Pagination_Component SHALL display page numbers with previous and next buttons
3. WHEN the user clicks a page number, THE History_Page SHALL load Document_Records for that page
4. WHEN the user is on the first page, THE Pagination_Component SHALL disable the previous button
5. WHEN the user is on the last page, THE Pagination_Component SHALL disable the next button
6. THE Pagination_Component SHALL display the current page number with a highlighted background
7. THE History_Page SHALL preserve filter parameters when navigating between pages

### Requirement 7: Document History Filtering

**User Story:** As a user, I want to filter documents by template, status, and date range, so that I can find specific documents quickly.

#### Acceptance Criteria

1. THE Filter_Component SHALL provide a dropdown to filter by template name
2. THE Filter_Component SHALL provide a dropdown to filter by status with options: all, draft, generated, error
3. THE Filter_Component SHALL provide date inputs to filter by date range with start date and end date
4. WHEN a filter is applied, THE History_Page SHALL query Document_Records matching all active filter criteria
5. WHEN the template filter is set, THE History_Page SHALL return only Document_Records with matching templateId
6. WHEN the status filter is set, THE History_Page SHALL return only Document_Records with matching status
7. WHEN the date range filter is set, THE History_Page SHALL return only Document_Records with createdAt between start date and end date inclusive
8. THE Filter_Component SHALL display a "Clear Filters" button that resets all filters to default values

### Requirement 8: Dashboard Statistics

**User Story:** As a user, I want to see key metrics on the dashboard, so that I can understand system usage at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Stats_Widget showing total document count from the Document table
2. THE Dashboard SHALL display a Stats_Widget showing documents created today count where createdAt date equals current date
3. THE Dashboard SHALL display a Stats_Widget showing total template count from the Template table where status equals "active"
4. THE Dashboard SHALL query the database for statistics on each page load
5. THE Stats_Widget SHALL display the metric value as a large number with a descriptive label
6. THE Stats_Widget SHALL use a card layout with padding and border styling
7. THE Dashboard SHALL arrange Stats_Widgets in a responsive grid with 3 columns on desktop and 1 column on mobile

### Requirement 9: Recent Documents List

**User Story:** As a user, I want to see my 5 most recent documents on the dashboard, so that I can quickly access recent work.

#### Acceptance Criteria

1. THE Dashboard SHALL display a list of the 5 most recent Document_Records ordered by createdAt descending
2. THE Dashboard SHALL display each recent document with filename, template name, and created date
3. WHEN a recent document has status "generated", THE Dashboard SHALL display a clickable link to the Google Docs URL
4. THE Dashboard SHALL display a "View All" link that navigates to the History_Page
5. WHEN no Document_Records exist, THE Dashboard SHALL display a message "Chưa có tài liệu nào"
6. THE Dashboard SHALL format the createdAt timestamp in relative format such as "2 hours ago" or "3 days ago"

### Requirement 10: Quick Action Button

**User Story:** As a user, I want a prominent button to create new documents, so that I can quickly start the document generation workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL display a button labeled "Tạo tài liệu mới"
2. WHEN the button is clicked, THE Dashboard SHALL navigate to the main document creation page
3. THE Dashboard SHALL position the button prominently in the top-right section of the page
4. THE Dashboard SHALL style the button with primary color background and white text
5. THE Dashboard SHALL display the button with sufficient padding for touch targets on mobile devices

### Requirement 11: Session Management

**User Story:** As a user, I want my session to persist across page refreshes, so that I do not need to log in repeatedly during normal usage.

#### Acceptance Criteria

1. THE Auth_System SHALL set JWT token expiration to 30 days from creation
2. WHEN a user closes the browser and returns within 30 days, THE Auth_System SHALL maintain the Session
3. WHEN a JWT token expires, THE Middleware SHALL redirect to the login page
4. THE Auth_System SHALL include user ID and name in the JWT payload
5. THE Auth_System SHALL validate JWT signature on every protected route request
6. WHEN a user clicks a logout button, THE Auth_System SHALL invalidate the Session and redirect to the login page

### Requirement 12: Mobile Responsive Design

**User Story:** As a mobile user, I want all authentication and history pages to work on my phone, so that I can access the system from any device.

#### Acceptance Criteria

1. THE Login_Page SHALL display input fields at full width on viewports less than 768 pixels wide
2. THE History_Page SHALL display the document table with horizontal scrolling on viewports less than 768 pixels wide
3. THE Filter_Component SHALL stack filter inputs vertically on viewports less than 768 pixels wide
4. THE Dashboard SHALL display Stats_Widgets in a single column on viewports less than 768 pixels wide
5. THE Pagination_Component SHALL reduce page number display to show only 3 page numbers on viewports less than 768 pixels wide
6. THE Dashboard SHALL display the quick action button at full width on viewports less than 768 pixels wide

### Requirement 13: Error Handling

**User Story:** As a user, I want clear error messages when authentication or data loading fails, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN database connection fails, THE History_Page SHALL display an error message "Không thể tải dữ liệu. Vui lòng thử lại."
2. WHEN authentication fails due to network error, THE Login_Page SHALL display an error message "Lỗi kết nối. Vui lòng kiểm tra mạng."
3. WHEN a user enters credentials that do not exist, THE Auth_System SHALL return error message "Tên đăng nhập hoặc mật khẩu không đúng"
4. WHEN the Auth_System encounters an unexpected error, THE Login_Page SHALL display a generic error message "Đã xảy ra lỗi. Vui lòng thử lại sau."
5. THE History_Page SHALL display a retry button when data loading fails
6. WHEN the retry button is clicked, THE History_Page SHALL attempt to reload Document_Records from the database

### Requirement 14: Environment Configuration

**User Story:** As a system administrator, I want authentication configured through environment variables, so that I can deploy to different environments without code changes.

#### Acceptance Criteria

1. THE Auth_System SHALL read NEXTAUTH_SECRET from environment variables for JWT signing
2. THE Auth_System SHALL read NEXTAUTH_URL from environment variables for callback URL construction
3. THE Auth_System SHALL read NEXTAUTH_CREDENTIALS from environment variables for hardcoded user validation
4. THE Middleware SHALL read ALLOWED_IPS from environment variables for IP whitelist validation
5. WHERE NEXTAUTH_SECRET is not set, THE Auth_System SHALL generate a random secret and log a warning message
6. THE Auth_System SHALL validate that NEXTAUTH_URL matches the current request origin
7. THE NEXTAUTH_CREDENTIALS environment variable SHALL use the format "username:hashedpassword,username2:hashedpassword2"
