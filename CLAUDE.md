# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MuscleUp Gym is a comprehensive gym management system built with Next.js 15, featuring member management, access control with biometric fingerprint devices (ZKTeco ZK9500), payment tracking, and role-based dashboards.

## Technology Stack

- **Framework**: Next.js 15 with React 19 and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with SSR support
- **Styling**: Tailwind CSS + Material-UI (MUI)
- **Biometric Integration**: ZKTeco ZK9500 fingerprint devices via WebSocket
- **PDF Generation**: @react-pdf/renderer, PDFKit
- **Animations**: Framer Motion, GSAP

## Common Commands

### Development
```bash
npm run dev        # Start development server with Turbo on 0.0.0.0
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

### Database
```bash
npx prisma generate          # Generate Prisma client
npx prisma db push           # Push schema changes to database
npx prisma studio            # Open Prisma Studio GUI
npx prisma migrate dev       # Create and apply migrations
```

## Architecture Overview

### 1. Authentication & Authorization

**Supabase SSR Integration**: The app uses Supabase's SSR package for authentication with cookie-based session management.

- **Client-side**: `src/lib/supabase/client.ts` - Browser client using `@supabase/ssr`
- **Server-side**: `src/lib/supabase/server.ts` and `server-async.ts` - Server clients for API routes
- **Admin client**: `src/lib/supabase/admin.ts` - Service role client for admin operations
- **Middleware**: `src/middleware.ts` - Route protection based on user roles

**Role System**: Three roles defined in `Users` table:
- `admin`: Full system access
- `empleado`: Employee access to admin features
- `cliente`: Client access to personal dashboard

**Route Protection**:
- Public routes: `/`, `/login`, `/registro`, etc.
- Protected routes: `/dashboard/*` (requires authentication)
- Admin routes: `/dashboard/admin/*` (requires admin/empleado role)
- Client routes: `/dashboard/cliente/*` (for clients)

The middleware (`src/middleware.ts`) reads roles from `user.user_metadata.role` for fast authorization without additional database queries.

### 2. Database Schema (Prisma)

**Key Models** in `prisma/schema.prisma`:
- `User`: Core user data (firstName, lastName, email, password, etc.)
- `Address`: User addresses (one-to-one with User)
- `EmergencyContact`: Emergency contact info (one-to-one with User)
- `MembershipInfo`: Membership details including training level and motivation

**Important**: The Prisma schema uses camelCase for field names (e.g., `firstName`, `lastName`), but Supabase tables may use snake_case. When querying directly via Supabase client (bypassing Prisma), use the actual database column names.

### 3. Biometric Access Control System

**Core Handler**: `src/lib/biometric/zk9500-handler.ts` - `ZK9500Handler` class

This is a real-time biometric access control system:
- **WebSocket Communication**: Connects to an access-agent service that interfaces with ZKTeco ZK9500 fingerprint readers
- **Device Management**: Connection status, heartbeat monitoring, automatic reconnection
- **Enrollment**: Captures fingerprints and stores templates in `fingerprint_templates` table
- **Verification**: Real-time fingerprint verification with access logging
- **Access Control**: Checks user memberships, remaining visits, and logs all access attempts

**Key Tables**:
- `biometric_devices`: Device configuration (IP, port, WebSocket port, status)
- `fingerprint_templates`: Stores fingerprint templates with `device_user_id` (ZK internal ID)
- `access_logs`: Records all access attempts (successful/denied) with timestamps and reasons
- `user_memberships`: Tracks active memberships, visit counts, start/end dates

**Access Flow**:
1. User places finger on ZK9500 device
2. Device sends template via WebSocket to access-agent
3. Handler verifies template against database
4. System checks active membership and remaining visits
5. Access granted/denied and logged to `access_logs`
6. If successful, visits decremented via RPC call

### 4. Dashboard Architecture

**Role-Based Dashboards**:

**Admin Dashboard** (`/dashboard/admin/*`):
- User management: `/dashboard/admin/usuarios`
- Employee management: `/dashboard/admin/empleados`
- Access control: `/dashboard/admin/acceso/*`
- Plans management: `/dashboard/admin/planes`
- Reports: `/dashboard/admin/reportes`

**Client Dashboard** (`/dashboard/cliente/*`):
- Personal info and membership status
- Payment history: `/dashboard/cliente/pagos`
- Purchase history: `/dashboard/cliente/compras`
- Access history: `/dashboard/cliente/historial`

**Dashboard Entry Point**: `/dashboard/page.tsx` automatically redirects based on user role using Supabase session data.

### 5. Component Organization

**UI Components** (`components/ui/*`): Reusable shadcn-style components (button, card, input, etc.)

**Feature Components**:
- `src/components/dashboard/admin/*`: Admin-specific components (UserTable, UserStatsCards, BiometricDeviceSelector)
- `src/components/biometric/*`: Biometric registration components
- `src/components/PlanForm/*`: Multi-step plan creation wizard
- `src/components/dialogs/*`: Dialog components for various operations

**Page Components** (`src/app/*`): Follow Next.js 15 App Router structure with route groups:
- `(protected)`: Routes requiring authentication
- `api`: API routes for server-side operations

### 6. API Routes Structure

Located in `src/app/api/*`:

**Access Control** (`/api/access-control/*`):
- `/verify-fingerprint`: Verify fingerprint and grant/deny access
- `/enroll`: Enroll new fingerprint
- `/devices`: Manage biometric devices
- `/config`: Access control configuration
- `/recent-attempts`: Recent access logs

**Biometric** (`/api/biometric/*`):
- `/connect`: Connect to ZK9500 device
- `/enroll`: Fingerprint enrollment
- `/verify`: Fingerprint verification
- `/status`: Device status
- `/manage`: Device management operations

**Admin** (`/api/admin/*`):
- `/users`: User CRUD operations
- `/employees`: Employee management
- `/create-employee`: Employee creation

**Other**:
- `/auth/*`: Authentication endpoints
- `/plans`: Membership plans
- `/sales`: Sales management
- `/user-memberships`: Membership operations

### 7. State Management Patterns

**Custom Hooks** (referenced in code):
- `useEntityCRUD`: Centralized CRUD operations with automatic auditing
- `useUserTracking`: User activity tracking and audit fields
- `useNotifications`: Toast notifications and alerts
- `useHydrated`: SSR safety check for client-side rendering

**Data Flow**:
1. Server Components fetch initial data via Supabase
2. Client Components use custom hooks for real-time updates
3. API routes handle mutations and complex operations
4. WebSocket connections for real-time biometric events

### 8. PDF Generation

The system generates various PDFs:
- **Contracts**: `/api/generate-contract` - User membership contracts with signatures
- **Reports**: Various report generation endpoints

Uses `@react-pdf/renderer` for React-based PDF generation and `PDFKit` for low-level PDF operations.

### 9. Notification System

**Email**: Nodemailer for transactional emails
- Welcome emails: `/api/send-welcome-email`
- Membership reminders: `/api/send-membership-reminders`

**WhatsApp**: Twilio integration
- Welcome messages: `/api/send-welcome-whatsapp`
- Membership notifications: `/api/send-membership-whatsapp`

**In-App**: Toast notifications using `react-hot-toast` and `sonner`

## Important Implementation Notes

### Working with Supabase Queries

**Field Name Conventions**:
- Prisma uses camelCase: `firstName`, `lastName`, `profilePictureUrl`
- Supabase tables may use snake_case: `first_name`, `last_name`, `profile_picture_url`
- When querying via Supabase client (not Prisma), check actual column names in database

**Relationships**:
- Use `.select()` with nested syntax for relations: `Users.select('*, addresses(*), membership_info(*)')`
- Handle both array and single object responses when normalizing data

### Biometric Device Communication

**Prerequisites**:
- An access-agent service must be running on the network
- WebSocket server should be accessible at `ws://{device.ip}:{device.wsPort}`
- ZK9500 device must be connected and configured with correct IP/port

**Command Pattern**:
- All commands are async and use Promise-based queue system
- Each command has a 30-second timeout
- Commands return `BiometricResponse` with `{ success, message, data?, error? }`

### Access Control Logic

**Membership Validation** (see `checkUserAccess` in zk9500-handler.ts):
1. User must exist in `Users` table
2. Must have active membership in `user_memberships` where:
   - `status = 'active'`
   - `start_date <= today`
   - `end_date >= today`
   - `remaining_visits > 0`
3. Access is logged regardless of success/failure

**Visit Tracking**:
- Use RPC function `decrement_user_visits` to atomically decrement visit count
- Never manually update `remaining_visits` to avoid race conditions

### Client-Side Hydration

**SSR Safety**: Always check hydration status before rendering client-specific content:
```typescript
const hydrated = useHydrated();
if (!hydrated) return <LoadingSpinner />;
```

This prevents hydration mismatches between server and client rendering.

### Environment Variables

Required in `.env.local`:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin operations)
- Twilio credentials for WhatsApp
- Email service credentials

**Security**: Never commit `.env.local` or expose service role keys in client-side code.

## Development Workflow

### Adding a New Feature

1. **Define types**: Add TypeScript interfaces in `src/types/` if needed
2. **Create API route**: Add route handler in `src/app/api/`
3. **Add database changes**: Update `prisma/schema.prisma` if needed and run migrations
4. **Create UI components**: Build reusable components in appropriate directory
5. **Add page**: Create page in `src/app/` following route group structure
6. **Update middleware**: Add route protection if needed in `src/middleware.ts`

### Testing Biometric Features

1. Ensure access-agent is running and ZK9500 device is connected
2. Test device connection via `/dashboard/admin/acceso/configuracion`
3. Enroll test fingerprint via user management interface
4. Verify enrollment by checking `fingerprint_templates` table
5. Test access by using fingerprint on device
6. Check `access_logs` table for recorded attempts

### Working with Prisma

**After schema changes**:
```bash
npx prisma format          # Format schema file
npx prisma validate        # Validate schema
npx prisma db push         # Push to database (development)
npx prisma generate        # Regenerate client
```

**For production**:
```bash
npx prisma migrate dev --name descriptive_name    # Create migration
npx prisma migrate deploy                          # Apply in production
```

## Key Files Reference

- `src/middleware.ts`: Route protection and role-based redirects
- `src/lib/supabase/config.ts`: Supabase configuration constants
- `src/lib/biometric/zk9500-handler.ts`: Biometric device handler
- `src/app/(protected)/dashboard/page.tsx`: Dashboard router
- `src/app/api/access-control/verify-fingerprint/route.ts`: Fingerprint verification endpoint
- `prisma/schema.prisma`: Database schema definition

## Common Issues and Solutions

**Issue**: Hydration mismatch errors
**Solution**: Use `useHydrated()` hook and render different content server-side vs client-side

**Issue**: Supabase query returns null for relations
**Solution**: Check if using correct field names (camelCase vs snake_case) and proper select syntax

**Issue**: Biometric device won't connect
**Solution**: Verify access-agent is running, check IP/port configuration, ensure WebSocket connectivity

**Issue**: Middleware redirects incorrectly
**Solution**: Check user role in Supabase auth metadata matches expected values (admin/empleado/cliente)

**Issue**: Visit count not decrementing
**Solution**: Ensure RPC function `decrement_user_visits` exists and is being called correctly
