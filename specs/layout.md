🟢 # Layout Specification

## Overview

Layout specification for the RPM Accesorios admin dashboard. Defines the structure, components, and integration patterns for the administrative interface.

## Architecture

### Layout Structure

```
app/adm/
├── layout.tsx          # Main layout wrapper
├── page.tsx            # Dashboard content
└── components/
    └── sidebar.tsx     # Navigation sidebar
```

### Component Hierarchy

```
AdminLayout (app/adm/layout.tsx)
├── Aside (sidebar)
│   ├── Header (title + collapse button)
│   └── Sidebar component (logout button)
└── Main (content area)
    └── {children} (dashboard pages)
```

## Components

### AdminLayout (`app/adm/layout.tsx`)

**Purpose:** Main layout wrapper for all admin pages.

**Key Features:**
- Collapsible sidebar (w-16 ↔ w-64)
- Handles authentication logic
- Provides consistent structure

**Props:** 
- `children: React.ReactNode` - Page content

**State:**
- `isSidebarCollapsed: boolean` - Controls sidebar width

**Authentication:**
- Uses `authClient.signOut()` for logout
- Redirects to `/login` after logout

### Sidebar (`components/sidebar.tsx`)

**Purpose:** Navigation sidebar with logout functionality.

**Props:**
- `onSignOut: () => void` - Logout handler

**Styling:**
- Outlined button style
- Icon + text layout
- Positioned at bottom of sidebar

### AdminDashboard (`app/adm/page.tsx`)

**Purpose:** Main dashboard content.

**Responsibilities:**
- Session validation
- Loading states
- Authentication redirects

**No layout logic** - Only content rendering.

## Database and Migrations

### Automatic Migrations

**Build Process:**
```json
"build": "npx prisma migrate deploy && next build"
```

**Migration Flow:**
1. **Deploy triggered** → Vercel runs build
2. **Prisma migrate deploy** → Applies pending migrations
3. **Next build** → Builds application
4. **No pending migrations** → Skips automatically

### Migration Files

**Location:** `prisma/migrations/001_init_auth_tables/migration.sql`

**Tables Created:**
- `user` - User accounts with email verification
- `account` - OAuth provider accounts
- `session` - User sessions with tokens
- `verification` - Email verification tokens

### Creating New Migrations

**For schema changes:**
```bash
npx prisma migrate dev --name new_feature
```

**Migration automatically applies in production on next deploy.**

## Styling Guidelines

### Theme
- Dark theme via `prefers-color-scheme: dark`
- CSS variables: `--background: #0a0a0a`, `--foreground: #ededed`

### Layout Classes
- `min-h-screen bg-background flex` - Full height layout
- `w-64` / `w-16` - Sidebar widths
- `flex-1` - Main content area
- `h-full flex flex-col` - Sidebar full height
- `flex-1 flex items-end` - Push content to bottom

### Button Styling
```css
/* Logout button */
border border-gray-600 text-gray-300 rounded
hover:bg-gray-800 hover:text-white
flex items-center justify-center gap-2
```

## Integration Patterns

### Authentication Flow
1. Layout handles session validation
2. Dashboard manages loading/error states
3. Sidebar receives logout handler as prop

### Database Integration
- Better Auth uses Prisma adapter
- Tables created via migrations
- Automatic schema updates on deploy

### Responsive Behavior
- Sidebar collapses to icon-only mode
- Main content adapts to sidebar width
- No mobile-specific handling (desktop-first)

## Common Errors to Avoid

### ❌ Don't Mix Layout and Content
```tsx
// WRONG - Dashboard shouldn't handle layout
return (
  <div className="flex">
    <Sidebar />
    <main>{content}</main>
  </div>
);
```

### ❌ Don't Duplicate Authentication
```tsx
// WRONG - Layout already handles auth
const handleSignOut = () => { /* duplicate logic */ };
```

### ❌ Don't Hardcode Layout in Pages
```tsx
// WRONG - Page shouldn't create layout structure
<div className="min-h-screen flex">
  {/* Layout logic here */}
</div>
```

### ❌ Don't Manual Database Setup
```bash
# WRONG - Don't run manual SQL scripts
psql $DATABASE_URL -f setup.sql
```

### ✅ Correct Patterns
```tsx
// Layout handles structure
export default function AdminLayout({ children }) {
  return (
    <div className="flex">
      <aside>{/* sidebar */}</aside>
      <main>{children}</main>
    </div>
  );
}

// Page handles only content
export default function Dashboard() {
  return <div>Dashboard content</div>;
}
```

```bash
# ✅ Use Prisma migrations for database changes
npx prisma migrate dev --name new_feature
git add prisma/migrations/
git commit -m "feat: add new table"
git push # Auto-applies in production
```

## CSS Considerations

### Variables
```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

### Avoid
- shadcn/ui complexity (use simple Tailwind)
- Complex color systems
- Unnecessary CSS frameworks

## File Locations

**Layout:** `app/adm/layout.tsx`
- Applies to all pages under `/adm/*`
- Handles sidebar and main content structure

**Pages:** `app/adm/*.tsx`
- Only render content
- Receive layout from parent

**Components:** `components/sidebar.tsx`
- Reusable sidebar component
- No layout dependencies

**Migrations:** `prisma/migrations/`
- Database schema changes
- Auto-applied on deploy

## Testing Notes

### Layout Testing
- Verify sidebar collapse/expand
- Test logout functionality
- Check responsive behavior

### Content Testing
- Session validation
- Loading states
- Error handling

### Database Testing
- Migration application
- Table creation
- Foreign key constraints

## Dependencies

### Required
- `@/lib/auth-client` - Authentication
- `react` - Hooks and components
- `@prisma/client` - Database client
- `prisma` - Migration tool

### Optional
- No UI libraries required
- No complex styling dependencies

## Migration Notes

### Production Deployment
- **Automatic:** Migrations run during build
- **Safe:** Only applies pending migrations
- **Versioned:** Each change tracked

### Development Workflow
1. **Modify schema.prisma**
2. **Create migration:** `npx prisma migrate dev --name feature`
3. **Test locally**
4. **Commit and push** - Auto-applies in production

### Migration Best Practices
- **Descriptive names** - Explain what changes
- **Review SQL** - Check generated migration
- **Test locally** - Verify before deploy
- **Backup database** - For production safety

## Troubleshooting

### Migration Issues
- **Error:** Table already exists
- **Fix:** Mark migration as applied manually
- **Command:** `npx prisma migrate resolve --applied migration_name`

### Build Failures
- **Error:** Migration syntax
- **Fix:** Review migration SQL
- **Test:** Run locally first

### Authentication Issues
- **Error:** Tables don't exist
- **Fix:** Ensure migrations ran
- **Check:** `npx prisma migrate deploy`

---

**Last Updated:** 2026-03-25  
**Status:** ✅ Implemented with automatic migrations
