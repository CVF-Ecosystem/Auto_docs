# Authentication Setup Guide

## Environment Variables

### Required Variables

1. **NEXTAUTH_SECRET** - Secret key for JWT signing
   ```bash
   # Generate a random secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **NEXTAUTH_URL** - Your application URL
   ```
   # Development
   NEXTAUTH_URL=http://localhost:3000
   
   # Production
   NEXTAUTH_URL=https://yourdomain.com
   ```

3. **DATABASE_URL** - PostgreSQL connection string
   ```
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/auto_docs
   ```

### Optional Variables

4. **NEXTAUTH_CREDENTIALS** - Hardcoded user credentials (for simple deployments)
   ```
   # Format: username:hashedpassword,username2:hashedpassword2
   NEXTAUTH_CREDENTIALS=admin:$2b$10$hashedpassword,user:$2b$10$hashedpassword2
   ```
   
   Generate hashed password:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10))"
   ```

5. **ALLOWED_IPS** - IP whitelist for additional security
   ```
   # Comma-separated list of allowed IPs
   ALLOWED_IPS=192.168.1.1,10.0.0.1
   
   # Leave empty to allow all IPs
   ALLOWED_IPS=
   ```

## Database Setup

### 1. Run Migration

The migration adds `username` and `password` fields to the User table:

```bash
# Apply migration
Get-Content prisma/migrations/add_user_credentials.sql | docker exec -i auto_docs_db psql -U postgres -d auto_docs

# Regenerate Prisma client
npx prisma generate
```

### 2. Create Admin User

The migration automatically creates a default admin user:
- **Username**: admin
- **Password**: admin123

**IMPORTANT**: Change this password in production!

To create additional users, insert into the database:

```sql
INSERT INTO "User" (id, name, username, password, role, "ocrMode", "createdAt")
VALUES (
  'user-id',
  'User Name',
  'username',
  '$2b$10$hashedpassword',  -- Generate with bcrypt
  'user',
  'gemini',
  NOW()
);
```

## Authentication Modes

### Mode 1: Environment Variable Authentication

Simple deployment with hardcoded credentials in `.env.local`:

```env
NEXTAUTH_CREDENTIALS=admin:$2b$10$W204f.Gk/CRAXiBTdV0hbuQC/zV.ApFXyBIHxTrvSe6DUBCHv8bbq
```

**Pros**: Simple, no database queries for auth
**Cons**: Credentials in environment file, harder to manage multiple users

### Mode 2: Database Authentication

Production-ready with users stored in database:

```env
# Leave NEXTAUTH_CREDENTIALS empty
NEXTAUTH_CREDENTIALS=
```

**Pros**: Scalable, users managed in database
**Cons**: Requires database queries for each login

## Testing Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000

3. You should be redirected to `/login`

4. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

5. After successful login, you should see the dashboard

## Security Checklist

- [ ] NEXTAUTH_SECRET is set to a strong random value (32+ characters)
- [ ] Default admin password has been changed
- [ ] HTTPS is enabled in production
- [ ] NEXTAUTH_URL matches your production domain
- [ ] IP whitelist is configured if needed (ALLOWED_IPS)
- [ ] Database credentials are secure
- [ ] Session cookies are httpOnly and secure in production

## Troubleshooting

### "NEXTAUTH_SECRET not set" warning

Generate a secret and add to `.env.local`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Login redirects to login page (infinite loop)

Check:
1. NEXTAUTH_SECRET is set correctly
2. NEXTAUTH_URL matches your current URL
3. Middleware is not blocking auth routes

### "Tên đăng nhập hoặc mật khẩu không đúng"

Check:
1. Username exists in database or NEXTAUTH_CREDENTIALS
2. Password is hashed correctly with bcrypt
3. Database connection is working

### IP blocked (403 error)

Check:
1. ALLOWED_IPS includes your current IP
2. Or set ALLOWED_IPS to empty string to disable IP whitelist

## Production Deployment

1. Set environment variables in production:
   ```env
   NEXTAUTH_SECRET=<strong-random-secret>
   NEXTAUTH_URL=https://yourdomain.com
   DATABASE_URL=<production-database-url>
   ALLOWED_IPS=<comma-separated-ips>
   ```

2. Run database migration:
   ```bash
   npx prisma migrate deploy
   ```

3. Build and start:
   ```bash
   npm run build
   npm start
   ```

4. Verify authentication works in production

5. Change default admin password immediately
