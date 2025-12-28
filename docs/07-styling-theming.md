# Styling & Theming

This document explains the styling system, Tailwind CSS configuration, and dark mode implementation.

## Overview

Finance Manager uses **Tailwind CSS v4** for styling with a custom dark mode implementation and theme system.

## Tailwind CSS v4

### Configuration

Tailwind v4 uses a **CSS-first configuration** instead of JavaScript config files.

**File**: `src/index.css`

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@theme {
  --font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;
  
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
}

@variant dark (.dark &);
```

### Key Differences from v3

**v3 Configuration** (JavaScript):
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: { extend: { colors: {...} } }
}
```

**v4 Configuration** (CSS):
```css
/* src/index.css */
@theme {
  --color-primary: #3b82f6;
}
@variant dark (.dark &);
```

## Dark Mode Implementation

### Strategy

Uses **class-based dark mode** with the `.dark` class on `<html>` element.

### Configuration

```css
@variant dark (.dark &);
```

This tells Tailwind to generate dark mode classes like:
```css
.dark .dark\:bg-gray-900 {
  background-color: var(--color-gray-900);
}
```

### Theme Toggle Component

**Location**: `src/App.tsx`

**Three Modes**:
1. **Light** (☀️): Forces light theme
2. **Dark** (🌙): Forces dark theme
3. **System** (💻): Follows OS preferences

**Implementation**:
```typescript
type Theme = 'light' | 'dark' | 'system';

const [theme, setTheme] = useState<Theme>(() => {
  const saved = localStorage.getItem('theme');
  return (saved as Theme) || 'system';
});

useLayoutEffect(() => {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = mediaQuery.matches;
    root.classList.toggle('dark', isDark);
    
    // Listen for system changes
    const listener = (e: MediaQueryListEvent) => {
      root.classList.toggle('dark', e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
  
  localStorage.setItem('theme', theme);
}, [theme]);
```

### Initial Theme Application

**File**: `index.html`

Script runs **before** React loads to prevent flash:

```html
<script>
  (function() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    const root = document.documentElement;
    
    if (savedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      }
    } else if (savedTheme === 'dark') {
      root.classList.add('dark');
    }
  })();
</script>
```

## Color System

### Default Tailwind Colors

Using Tailwind's default color palette:
- Gray: `gray-50` to `gray-950`
- Blue: `blue-50` to `blue-900`
- Green: `green-50` to `green-900`
- Red: `red-50` to `red-900`
- Purple: `purple-50` to `purple-900`
- Orange: `orange-50` to `orange-900`

### Custom Colors

Defined in `@theme`:
```css
@theme {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  /* ... */
}
```

Usage:
```tsx
<div className="bg-primary-500 text-white">
```

### Dark Mode Colors

Every light color has a dark variant:

```tsx
// Background
bg-white dark:bg-gray-800

// Text
text-gray-900 dark:text-gray-100

// Borders
border-gray-200 dark:border-gray-700

// Hover states
hover:bg-gray-100 dark:hover:bg-gray-700
```

## Typography

### Font Family

**Primary Font**: Inter (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@theme {
  --font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;
}
```

### Font Sizes

Using Tailwind's default scale:

```tsx
text-xs    // 0.75rem (12px)
text-sm    // 0.875rem (14px)
text-base  // 1rem (16px)
text-lg    // 1.125rem (18px)
text-xl    // 1.25rem (20px)
text-2xl   // 1.5rem (24px)
text-3xl   // 1.875rem (30px)
text-4xl   // 2.25rem (36px)
```

### Font Weights

```tsx
font-medium    // 500
font-semibold  // 600
font-bold      // 700
```

## Layout & Spacing

### Container Width

```tsx
<div className="max-w-7xl mx-auto">
  {/* Content constrained to 80rem (1280px) */}
</div>
```

### Padding Scale

Using Tailwind's spacing scale (0.25rem = 4px):

```tsx
p-3   // 0.75rem (12px)
p-4   // 1rem (16px)
p-6   // 1.5rem (24px)
p-8   // 2rem (32px)
p-12  // 3rem (48px)
```

### Responsive Padding

```tsx
<div className="px-8 sm:px-12 lg:px-16 py-12">
  {/* Responsive padding */}
</div>
```

## Component Patterns

### Card Pattern

```tsx
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border-2 border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
  {/* Card content */}
</div>
```

**Breakdown**:
- `bg-white dark:bg-gray-800`: Background color
- `rounded-2xl`: Large border radius
- `shadow-md`: Medium shadow
- `border-2 border-gray-100 dark:border-gray-700`: Border
- `p-6`: Padding
- `hover:shadow-lg transition-shadow`: Hover effect

### Button Pattern

**Primary Button**:
```tsx
<button className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-200">
  Click Me
</button>
```

**Secondary Button**:
```tsx
<button className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
  Cancel
</button>
```

### Input Pattern

```tsx
<input className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
```

### Gradient Pattern

```tsx
<div className="bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  {/* Gradient background */}
</div>
```

## Animations & Transitions

### Built-in Animations

**Spin** (Loading indicator):
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
```

**Fade In** (Custom):
```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}
```

### Transitions

**Duration**:
```tsx
transition-all duration-150
transition-colors duration-200
transition-shadow duration-300
```

**Transform**:
```tsx
hover:-translate-y-1       // Move up on hover
group-hover:scale-110      // Scale on group hover
transform hover:scale-105  // Scale on hover
```

## Responsive Design

### Grid System

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 1 col mobile, 2 tablet, 4 desktop */}
</div>
```

### Breakpoint Visibility

```tsx
<div className="block md:hidden">
  {/* Mobile only */}
</div>

<div className="hidden md:block">
  {/* Tablet and desktop */}
</div>
```

### Responsive Text

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  {/* Responsive heading */}
</h1>
```

## Icons

Using **emoji icons** for simplicity:

```tsx
<span className="text-4xl">💰</span>  // Money bag
<span className="text-4xl">🏦</span>  // Bank
<span className="text-4xl">📈</span>  // Chart increasing
<span className="text-4xl">📉</span>  // Chart decreasing
```

**Advantages**:
- No icon library needed
- Universal across devices
- Accessible by default
- Easy to customize size

## Global Styles

**File**: `src/index.css`

```css
body {
  min-height: 100vh;
  font-family: var(--font-family-sans);
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #e0e7ff 100%);
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::selection {
  background-color: rgba(37, 99, 235, 0.2);
  color: rgb(30, 58, 138);
}

html {
  scroll-behavior: smooth;
}
```

## Customizing Tailwind

### Adding Custom Colors

```css
@theme {
  --color-brand-blue: #3b82f6;
  --color-brand-green: #10b981;
}
```

Usage:
```tsx
<div className="bg-brand-blue text-white">
```

### Adding Custom Utilities

```css
@layer utilities {
  .text-gradient {
    @apply bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent;
  }
}
```

Usage:
```tsx
<h1 className="text-gradient">Gradient Text</h1>
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Android

**Features Used**:
- CSS Grid
- CSS Variables
- Flexbox
- Media Queries (@media prefers-color-scheme)
- Modern JavaScript (ES2020+)

## Performance

### CSS Optimization

- **PurgeCSS**: Automatically removes unused styles in production
- **Minification**: Compressed CSS in build
- **Critical CSS**: Inline critical styles (potential improvement)

### Build Output

```bash
npm run build

# Output
src/index.css → dist/assets/index-[hash].css (optimized)
```

## Related Documentation

- [Frontend Components](./06-frontend-components.md)
- [Development Workflow](./09-development-workflow.md)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
