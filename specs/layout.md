# Layout Specification

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

## Testing Notes

### Layout Testing
- Verify sidebar collapse/expand
- Test logout functionality
- Check responsive behavior

### Content Testing
- Session validation
- Loading states
- Error handling

## Dependencies

### Required
- `@/lib/auth-client` - Authentication
- `react` - Hooks and components

### Optional
- No UI libraries required
- No complex styling dependencies

## Migration Notes

When adding new admin pages:
1. Create page in `app/adm/[page].tsx`
2. No layout code needed
3. Use existing authentication patterns
4. Follow content-only approach

---

**Last Updated:** 2026-03-25  
**Status:** ✅ Implemented and tested
