# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MuscleUp Gym is a comprehensive gym management system built with Next.js 15, featuring member management, access control with biometric fingerprint devices (ZKTeco ZK9500), payment tracking, and role-based dashboards with advanced analytics.

## Technology Stack

- **Framework**: Next.js 15.5.4 with React 19 and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with SSR support
- **Styling**: Tailwind CSS + Material-UI (MUI) v6
- **Charts & Visualization**: MUI X Charts v8.14.0 (previously Tremor - migrated)
- **Biometric Integration**: ZKTeco ZK9500 fingerprint devices via WebSocket
- **PDF Generation**: @react-pdf/renderer, PDFKit
- **Animations**: Framer Motion, GSAP
- **Desktop App**: Electron 38.x for native Windows/Mac/Linux application

## Common Commands

### Development
```bash
npm run dev        # Start development server with Turbo on 0.0.0.0
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

### Electron Desktop App
```bash
npm run electron:dev           # Start Electron app in development mode
npm run electron:build         # Build for all platforms
npm run electron:build:win     # Build for Windows (NSIS + Portable)
npm run electron:build:mac     # Build for macOS (DMG + ZIP)
npm run electron:build:linux   # Build for Linux (AppImage + deb + rpm)
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
- `EmergencyContact`: Emergency contact info (one-to-one with User) - **includes bloodType field**
- `MembershipInfo`: Membership details including training level and motivation

**Important Column Naming**:
- The database uses **camelCase** for all column names (not snake_case)
- Examples: `firstName`, `lastName`, `bloodType`, `createdAt`
- The `emergency_contacts` table stores `bloodType` (not in Users table)
- Always refer to `SCHEMA_COMPLETO.txt` for the complete and accurate schema

**Data Normalization**:
- Gender values should be normalized to: "Masculino", "Femenino", "Otro", "No especificado"
- Blood types should be normalized to: "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "N/A"

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
- Main Dashboard: `/dashboard/admin/dashboard` - **MUI X Charts v8.14.0 visualizations**
  - User statistics cards with animations
  - Sales and membership line charts
  - Revenue bar charts (stacked)
  - Payment methods pie chart
  - Gender distribution chart
  - Membership status chart
  - Month-over-month comparison
- User management: `/dashboard/admin/usuarios`
- Employee management: `/dashboard/admin/empleados`
- Access control: `/dashboard/admin/acceso/*`
- Plans management: `/dashboard/admin/planes`
- Advanced Analytics: `/dashboard/admin/reportes` (previously Reportes)
  - Advanced filtering (gender, blood type, membership status, expiration)
  - CSV export functionality
  - Real-time charts with MUI X Charts
  - Fully responsive design

**Client Dashboard** (`/dashboard/cliente/*`):
- Personal info and membership status
- Payment history: `/dashboard/cliente/pagos`
- Purchase history: `/dashboard/cliente/compras`
- Access history: `/dashboard/cliente/historial`

**Dashboard Entry Point**: `/dashboard/page.tsx` automatically redirects based on user role using Supabase session data.

### 5. Component Organization

**UI Components** (`components/ui/*`): Reusable shadcn-style components (button, card, input, etc.)

**Chart Components** (`src/components/dashboard/charts/*`):
- `DashboardMetricsCard.tsx`: Animated metric cards with hover effects and trends
- `SalesLineChart.tsx`: Line chart with area fill for sales and memberships
- `RevenueBarChart.tsx`: Stacked bar chart for monthly revenue breakdown
- `PaymentMethodsPieChart.tsx`: Interactive pie chart for payment methods
- `GenderDistributionChart.tsx`: Pie chart for gender distribution
- `MembershipStatusChart.tsx`: Pie chart for membership status
- `MonthComparisonChart.tsx`: Bar chart for month-over-month metrics
- `index.ts`: Centralized exports for all chart components

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

**Analytics & Stats** (`/api/users/*`):
- `/api/users/analytics`: Advanced analytics data with filters (server-side Supabase queries)
  - Returns normalized user data with gender, blood type, membership status
  - Joins Users, emergency_contacts, and user_memberships tables
  - Handles data normalization (Masculino/Femenino, blood type formats)
- `/api/users/stats`: Dashboard statistics and metrics

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

### 7. Charts & Visualization (MUI X Charts v8.14.0)

**Migration from Tremor**: The project has been fully migrated from Tremor to MUI X Charts v8.14.0.

**Chart Components Pattern**:
```typescript
import { LineChart, BarChart, PieChart } from '@mui/x-charts';

// Responsive sizing pattern
const chartConfig = {
  width: { xs: 300, sm: 400, md: 500 },
  height: { xs: 200, sm: 250, md: 300 }
};

// Color scheme
const colors = ['#ffcc00', '#e6b800', '#d4a000', '#c29200'];
```

**Key Features**:
- Professional color schemes with gym branding (#ffcc00 yellow accent)
- Fully responsive charts with breakpoint-specific sizing
- Interactive tooltips and legends
- Smooth animations with Framer Motion
- Loading skeletons for better UX
- Gradient accents and visual hierarchy

**Responsive Breakpoints**:
- xs (0-600px): Mobile - compact layout, vertical legends, smaller fonts
- sm (600-900px): Tablet - medium spacing, horizontal legends
- md (900px+): Desktop - full spacing, optimal chart sizes
- lg (1200px+): Large - multi-column grid layouts

### 8. State Management Patterns

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

### 9. PDF Generation

The system generates various PDFs:
- **Contracts**: `/api/generate-contract` - User membership contracts with signatures
- **Reports**: Various report generation endpoints

Uses `@react-pdf/renderer` for React-based PDF generation and `PDFKit` for low-level PDF operations.

### 10. Notification System

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
- **CRITICAL**: The database uses camelCase for ALL column names
- Examples: `firstName`, `lastName`, `bloodType`, `createdAt`
- Always check `SCHEMA_COMPLETO.txt` for accurate column names
- When in doubt, verify the actual schema rather than assuming snake_case

**Data Fetching Pattern (REQUIRED)**:
- **ALWAYS use API routes for data fetching** (server-side Supabase queries)
- **NEVER query Supabase directly from client components**
- Pattern: Client Component → fetch('/api/endpoint') → API Route → Supabase Server Client
- Example: Dashboard uses `/api/users/stats`, Analytics uses `/api/users/analytics`

**Relationships**:
- Use `.select()` with nested syntax for relations
- Emergency contacts: `Users.select('*, emergency_contacts(bloodType)')`
- Addresses: `Users.select('*, addresses(*)')`
- Handle both array and single object responses when normalizing data

**Example Query Pattern**:
```typescript
// In API route (server-side)
const { data, error } = await supabase
  .from('Users')
  .select(`
    id,
    firstName,
    lastName,
    email,
    emergency_contacts(bloodType)
  `)
  .eq('rol', 'cliente');
```

### Material-UI (MUI) Patterns

**Grid Import Pattern** (CRITICAL):
```typescript
// ✅ CORRECT
import { Grid } from '@mui/material';

// ❌ WRONG - Do not use Grid2
import Grid from '@mui/material/Grid2';
```

**Responsive Design Pattern**:
```typescript
// Use responsive object notation for all spacing and sizing
<Box sx={{
  p: { xs: 2, sm: 3, md: 4 },
  fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
  width: { xs: '100%', sm: '80%', md: '60%' }
}}>
```

**Color Tokens** (use throughout for consistency):
```typescript
const colorTokens = {
  primary: '#ffcc00',     // Yellow brand color
  neutral200: '#f5f5f5',
  neutral300: '#e0e0e0',
  neutral400: '#bdbdbd',
  textPrimary: '#1a1a1a',
  textSecondary: '#757575',
  textMuted: '#9e9e9e'
};
```

### Logging Conventions

Use structured logging with emoji prefixes for better visibility:
```typescript
console.log('📊 [ANALYTICS] Loading user data...');
console.log('✅ [API] Data processed successfully');
console.log('❌ [API] Error fetching users:', error);
console.log('🔍 [FILTROS] Applying filters:', filters);
```

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
2. **Create API route**: Add route handler in `src/app/api/` (server-side Supabase queries)
3. **Add database changes**: Update `prisma/schema.prisma` if needed and run migrations
4. **Create UI components**: Build reusable components in appropriate directory
5. **Add page**: Create page in `src/app/` following route group structure
6. **Update middleware**: Add route protection if needed in `src/middleware.ts`
7. **Implement responsive design**: Use MUI responsive patterns ({ xs, sm, md })

### Adding Charts/Visualizations

1. **Use MUI X Charts v8.14.0** (not Tremor or other libraries)
2. **Create chart component** in `src/components/dashboard/charts/`
3. **Follow responsive pattern** with breakpoint-specific sizing
4. **Use brand colors**: Primary yellow (#ffcc00) with professional contrasts
5. **Add to index.ts** for centralized exports
6. **Include loading states** with skeleton components
7. **Test on all breakpoints**: xs (mobile), sm (tablet), md (desktop)

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

### Core Configuration
- `src/middleware.ts`: Route protection and role-based redirects
- `src/lib/supabase/config.ts`: Supabase configuration constants
- `src/lib/supabase/client.ts`: Browser Supabase client
- `src/lib/supabase/server.ts`: Server Supabase client
- `src/lib/supabase/admin.ts`: Admin Supabase client (service role)
- `prisma/schema.prisma`: Database schema definition
- `SCHEMA_COMPLETO.txt`: Complete database schema reference (41KB)

### Biometric System
- `src/lib/biometric/zk9500-handler.ts`: Biometric device handler
- `src/app/api/access-control/verify-fingerprint/route.ts`: Fingerprint verification endpoint

### Dashboards & Analytics
- `src/app/(protected)/dashboard/page.tsx`: Dashboard router
- `src/app/(protected)/dashboard/admin/dashboard/page.tsx`: Admin dashboard with MUI X Charts
- `src/app/(protected)/dashboard/admin/reportes/page.tsx`: Advanced analytics page
- `src/app/api/users/analytics/route.ts`: Analytics API endpoint
- `src/app/api/users/stats/route.ts`: Dashboard stats API endpoint

### Chart Components
- `src/components/dashboard/charts/DashboardMetricsCard.tsx`: Metric cards
- `src/components/dashboard/charts/SalesLineChart.tsx`: Sales line chart
- `src/components/dashboard/charts/RevenueBarChart.tsx`: Revenue bar chart
- `src/components/dashboard/charts/PaymentMethodsPieChart.tsx`: Payment methods pie
- `src/components/dashboard/charts/GenderDistributionChart.tsx`: Gender pie chart
- `src/components/dashboard/charts/MembershipStatusChart.tsx`: Status pie chart
- `src/components/dashboard/charts/index.ts`: Chart exports

### Authentication
- `src/app/login/page.tsx`: Login page (premium black background design)
- `src/app/registro/page.tsx`: Registration page

## Common Issues and Solutions

**Issue**: Hydration mismatch errors
**Solution**: Use `useHydrated()` hook and render different content server-side vs client-side

**Issue**: Supabase query returns null for relations
**Solution**: Check if using correct field names (camelCase, not snake_case) and proper select syntax. Always reference SCHEMA_COMPLETO.txt

**Issue**: "column Users.bloodType does not exist"
**Solution**: bloodType is in the `emergency_contacts` table, not Users. Query with proper join:
```typescript
.select('*, emergency_contacts(bloodType)')
```

**Issue**: Grid component not working
**Solution**: Use `import { Grid } from '@mui/material'` NOT `import Grid from '@mui/material/Grid2'`

**Issue**: Filters not working in analytics
**Solution**: Ensure filter values match normalized data (e.g., "Masculino" not "M", "O+" not "o+")

**Issue**: Biometric device won't connect
**Solution**: Verify access-agent is running, check IP/port configuration, ensure WebSocket connectivity

**Issue**: Middleware redirects incorrectly
**Solution**: Check user role in Supabase auth metadata matches expected values (admin/empleado/cliente)

**Issue**: Visit count not decrementing
**Solution**: Ensure RPC function `decrement_user_visits` exists and is being called correctly

**Issue**: Charts not rendering
**Solution**: Verify MUI X Charts v8.14.0 is installed, check responsive sizing props, ensure data format matches chart requirements

**Issue**: Turbopack aggressive caching
**Solution**: If code changes aren't reflected, try `rm -rf .next && npm run dev` for clean rebuild

## Recent Major Changes (2025-10)

### Tremor → MUI X Charts Migration
- **Removed**: @tremor/react dependency and all Tremor components
- **Added**: MUI X Charts v8.14.0 throughout dashboard and analytics
- **Benefit**: Better performance, consistency with MUI design system, professional visualizations

### Login Page Redesign
- **Background**: 100% black (#000000) for logo compatibility
- **Design**: Premium glassmorphism with backdrop blur
- **Features**: Icon inputs, shine effects, enhanced animations
- **Responsive**: Optimized for mobile, tablet, and desktop

### Advanced Analytics Page
- **Transformation**: Reportes → Análisis Avanzado
- **Features**: Advanced filtering, CSV export, real-time charts
- **Data**: Normalized gender and blood type values
- **Architecture**: Server-side data fetching via `/api/users/analytics`

### Code Cleanup
- **Removed**: 32+ obsolete documentation files
- **Removed**: Deprecated Supabase utility files
- **Kept**: Essential documentation (SCHEMA_COMPLETO.txt, system guides)
- **Result**: -14,755 lines of code (cleaner, more maintainable)

## Sistema de Herramientas y Respaldos (Octubre 2025)

### Configuración General
**Ruta**: `/dashboard/admin/herramientas/configuracion`

Sistema completo de configuración del gimnasio con 3 pestañas:

#### Tab 1: Datos del Gimnasio
- **Información Básica**: Nombre, teléfono, email, dirección
- **Personalización**: URL del logo
- **Redes Sociales**: Facebook, Google Maps
- **Horarios de Operación**: 7 días de la semana con switches de activación
  - Time pickers para apertura/cierre
  - Deshabilitación individual por día

#### Tab 2: Comisiones de Pago
- CRUD completo de comisiones
- Tipos: Porcentaje o Monto Fijo
- Estado activo/inactivo
- Monto mínimo configurable

#### Tab 3: Días Festivos
- CRUD completo de días festivos
- Tipos: Oficial, Tradicional, Especial
- Emojis personalizables
- Invalidación automática de caché

**API Routes**:
- `GET/PUT /api/gym-settings`
- `GET/POST/PUT/DELETE /api/payment-commissions`
- `GET/POST/PUT/DELETE /api/holidays`

---

### Respaldo de Datos
**Ruta**: `/dashboard/admin/herramientas/respaldos`

Sistema de backups con Supabase PRO integration:

#### Características Principales
- **Backups Manuales**: Exportación JSON de 24 tablas vía Supabase API
- **Backups Automáticos**: Supabase PRO (7 días de retención, PITR)
- **Exportación a Excel**: 6 categorías seleccionables con ExcelJS
- **Dashboard Visual**: 4 métricas en tiempo real

#### Tablas Respaldadas (24 total)
- Configuración: `gym_settings`, `holidays`, `payment_commissions`
- Planes: `plans`, `user_memberships`, `payments`
- Usuarios: `Users`, `addresses`, `emergency_contacts`, `membership_info`
- Biométrico: `biometric_devices`, `fingerprint_templates`, `access_logs`
- Inventario: `products`, `warehouses`, `inventory_movements`, `suppliers`
- Ventas: `sales`, `sale_items`, `layaway_status_history`
- Administración: `expenses`, `expense_categories`, `cuts`, `system_logs`

**API Routes**:
- `GET /api/backups` - Listar backups
- `POST /api/backups/create` - Crear backup (Supabase API)
- `GET /api/backups/[id]` - Descargar backup
- `DELETE /api/backups/[id]` - Eliminar backup
- `POST /api/export/excel` - Exportar a Excel

**Importante**: 
- Usa `createServerSupabaseClient()` de `/src/lib/supabase/server.ts`
- Backups se guardan en `/backups/` (ignorados en git)
- Formato JSON con metadata completa

**Documentación Completa**: Ver `/BACKUP_SYSTEM.md`

---

### Accesos Directos en AppBar

Botones de acceso rápido agregados en la barra superior del AdminLayout:

#### Desktop (≥960px)
- **Botón POS**: Amarillo relleno con icono de carrito
  - Link: `/dashboard/admin/pos`
  - Style: `contained`, `color: primary`
  
- **Botón Membresía**: Amarillo outlined con icono de usuario
  - Link: `/dashboard/admin/membresias/registrar`
  - Style: `outlined`, `color: primary`

#### Móvil (<960px)
- IconButtons compactos (38x38px)
- Tooltips informativos
- Mismo color scheme que desktop

**Ubicación**: Entre logo/SGI y área de notificaciones

---

### Grid Pattern Correcto (IMPORTANTE)

**SIEMPRE usar este patrón**:
```typescript
import { Grid } from '@mui/material';

<Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    {/* Contenido */}
  </Grid>
</Grid>
```

**NO usar**:
- ❌ `import Grid from '@mui/material/Grid2'`
- ❌ `<Grid item xs={12}>`
- ❌ Spacing fijo sin breakpoints

---

### Theme Dark Centralizado

**SIEMPRE importar y usar colorTokens**:
```typescript
import { colorTokens } from '@/theme';

// Colores principales
bgcolor: colorTokens.neutral300      // Backgrounds
color: colorTokens.textPrimary       // Texto blanco
color: colorTokens.textSecondary     // Texto gris claro
color: colorTokens.brand             // Amarillo #FFCC00
color: colorTokens.success           // Verde #22C55E
color: colorTokens.info              // Azul #38BDF8
color: colorTokens.warning           // Amarillo #FFCC00
color: colorTokens.danger            // Rojo #EF4444
border: colorTokens.border           // Borde transparente
```

**NO usar colores hardcodeados**:
- ❌ `color: '#4ade80'`
- ❌ `bgcolor: 'rgba(255,255,255,0.1)'`
- ❌ `background: 'linear-gradient(...)'`

**Theme ubicado en**: `/src/theme.ts`

---

### Supabase Server Client

**Import correcto en API routes**:
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  // NO await, ya es síncrono
}
```

**NO usar**:
- ❌ `createServerClient` (no existe)
- ❌ `await createServerSupabaseClient()` (no es async)

---

### Estructura de Archivos Creados

**Nuevos archivos**:
```
src/app/api/backups/
├── route.ts              # GET listar backups
├── create/route.ts       # POST crear backup
└── [id]/route.ts         # GET descargar, DELETE eliminar

src/app/api/export/
└── excel/route.ts        # POST exportar a Excel

src/app/(protected)/dashboard/admin/herramientas/
├── configuracion/page.tsx    # Configuración general
└── respaldos/page.tsx        # Respaldo de datos

backups/                   # Directorio de backups (git ignored)
└── .gitignore

BACKUP_SYSTEM.md          # Documentación completa del sistema
```

---

### Testing del Sistema

**Verificar backups**:
```bash
# Listar backups
curl http://localhost:3000/api/backups

# Crear backup
curl -X POST http://localhost:3000/api/backups/create

# Verificar archivos
ls -lh /workspaces/muscleup-gym/backups/
```

**Verificar TypeScript**:
```bash
npx tsc --noEmit --skipLibCheck
# Debe mostrar 0 errores en herramientas
```

---

### Checklist de Implementación

Cuando agregues nuevas páginas similares:

- [ ] Importar `{ Grid } from '@mui/material'`
- [ ] Usar `size={{ xs, sm, md }}` en Grid
- [ ] Importar y usar `colorTokens` de `/theme.ts`
- [ ] Usar `createServerSupabaseClient()` en API routes
- [ ] Hacer páginas responsive con breakpoints
- [ ] Agregar ruta en `AdminLayoutClient.tsx`
- [ ] Verificar 0 errores de TypeScript
- [ ] Probar funcionalidad completa

---

## Aplicación de Escritorio (Electron)

### Overview

El sistema MuscleUp Gym Admin está disponible como aplicación de escritorio nativa usando Electron 38.x. Esto proporciona:

- **Mejor integración con hardware**: Lectores biométricos, impresoras, etc.
- **Rendimiento mejorado**: App nativa sin overhead del navegador
- **Funcionalidad offline**: Preparada para trabajar sin conexión (futuro)
- **Experiencia profesional**: Ventana nativa dedicada para el personal administrativo

### Arquitectura Electron

**Proceso Principal** (`electron/main.js`):
- Maneja la ventana principal de la aplicación
- Configuración: 1400x900 (mínimo 1024x768)
- Menú personalizado con opciones de administración
- IPC handlers para comunicación segura
- Context isolation habilitado

**Preload Script** (`electron/preload.js`):
- Context bridge para exponer APIs al renderer
- Comunicación segura entre main y renderer process
- Expone `window.electron` con métodos seguros

**Configuración de Build** (`electron-builder.json`):
- Targets: Windows (NSIS + Portable), macOS (DMG + ZIP), Linux (AppImage + deb + rpm)
- AppId: `com.muscleupgym.admin`
- Auto-updates configurables

### Scripts Disponibles

```bash
# Desarrollo (requiere Next.js corriendo)
npm run electron:dev

# Build para todas las plataformas
npm run electron:build

# Build específico por plataforma
npm run electron:build:win     # Windows
npm run electron:build:mac     # macOS
npm run electron:build:linux   # Linux
```

### Estructura de Archivos

```
electron/
├── main.js                    # Proceso principal
├── preload.js                 # Script preload (context bridge)
├── entitlements.mac.plist     # Permisos macOS
└── assets/
    ├── icon.ico               # Ícono Windows
    ├── icon.icns              # Ícono macOS
    └── icons/                 # Íconos PNG para Linux

electron-builder.json          # Configuración de empaquetado
ELECTRON_APP.md               # Documentación completa
```

### Modo Desarrollo vs Producción

**Desarrollo:**
- Conecta a `http://localhost:3000/dashboard/admin`
- Hot reload disponible
- DevTools abierto automáticamente
- Variables de entorno de desarrollo

**Producción:**
- Carga archivos estáticos de `/out/`
- No requiere servidor Node.js corriendo
- Optimizado y minificado

### Detección de Entorno Electron

En componentes React, detectar si está corriendo en Electron:

```typescript
if (typeof window !== 'undefined' && window.electron?.isElectron) {
  // Código específico para Electron
  const version = await window.electron.getAppVersion();
  const platform = window.electron.platform; // 'win32', 'darwin', 'linux'
}
```

### IPC Communication

**Agregar nuevo handler:**

1. En `electron/main.js`:
```javascript
ipcMain.handle('my-new-handler', async (event, arg) => {
  // Lógica del main process
  return result;
});
```

2. En `electron/preload.js`:
```javascript
contextBridge.exposeInMainWorld('electron', {
  // ... existing methods
  myNewMethod: (arg) => ipcRenderer.invoke('my-new-handler', arg)
});
```

3. En componentes React:
```typescript
const result = await window.electron.myNewMethod(arg);
```

### Distribución

**Outputs generados** (en `/dist/`):

**Windows:**
- `MuscleUp Gym Admin-0.1.0-x64.exe` - Instalador NSIS
- `MuscleUp Gym Admin-0.1.0-portable.exe` - Versión portable

**macOS:**
- `MuscleUp Gym Admin-0.1.0.dmg` - Imagen de disco
- `MuscleUp Gym Admin-0.1.0-mac.zip` - Archivo comprimido

**Linux:**
- `MuscleUp Gym Admin-0.1.0.AppImage` - AppImage universal
- `MuscleUp Gym Admin-0.1.0.deb` - Paquete Debian/Ubuntu
- `MuscleUp Gym Admin-0.1.0.rpm` - Paquete RedHat/Fedora

### Iconos de la Aplicación

**Requerimientos:**
- Windows: `icon.ico` (256x256, multi-resolución)
- macOS: `icon.icns` (hasta 1024x1024, multi-resolución)
- Linux: Carpeta `icons/` con PNG (16, 32, 48, 64, 128, 256, 512)

**Generar iconos:**
1. Crear PNG 1024x1024 con logo de MuscleUp Gym
2. Usar https://www.electron.build/icons o `electron-icon-builder`
3. Colocar en `electron/assets/`

Ver `electron/assets/README.md` para instrucciones detalladas.

### Seguridad

**Configuración de seguridad aplicada:**
- Context Isolation: ✅ Habilitado
- Node Integration: ❌ Deshabilitado
- Remote Module: ❌ Deshabilitado
- Preload Script: ✅ Configurado
- Sandboxing: ✅ Activo

**Nunca:**
- Deshabilitar context isolation
- Habilitar nodeIntegration en webPreferences
- Exponer módulos completos de Node.js en preload

### Próximas Mejoras

1. **Auto-Updates**: Implementar electron-updater
2. **Exportación Estática**: Configurar Next.js con `output: 'export'`
3. **Notificaciones Nativas**: Sistema de notificaciones del SO
4. **Tray Icon**: App en bandeja del sistema
5. **Base de Datos Local**: SQLite para modo offline
6. **Global Shortcuts**: Atajos de teclado globales

### Troubleshooting

**Ventana en blanco:**
- Verificar que Next.js esté corriendo en puerto 3000
- Abrir DevTools (F12) y revisar errores
- Verificar `startURL` en `electron/main.js`

**Build falla:**
- Windows: Ejecutar como admin, agregar excepción en antivirus
- macOS: Deshabilitar firma con `CSC_IDENTITY_AUTO_DISCOVERY=false`
- Linux: Instalar dependencias del sistema (libgconf-2-4, etc.)

**Más información:**
Ver documentación completa en [ELECTRON_APP.md](ELECTRON_APP.md)

