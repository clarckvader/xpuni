# School Rewards App - Quick Reference Guide

## 30-Second Quickstart

```bash
# 1. Install dependencies
pnpm install

# 2. Create .env.local
cp .env.example .env.local

# 3. Start development server
pnpm dev

# 4. Open http://localhost:5173
```

## Key Commands

```bash
pnpm dev           # Start dev server
pnpm build         # Build for production
pnpm preview       # Preview prod build locally
pnpm lint          # Check code quality
pnpm test          # Run unit tests
pnpm test:e2e      # Run E2E tests
```

## Project Routes

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page

### Protected Routes (requires authentication)
- `/profile` - User profile
- `/student/*` - Student dashboard
- `/reviewer/*` - Reviewer dashboard
- `/admin/*` - Admin dashboard

## API Base URL

The app expects a backend API running at the URL in `VITE_API_BASE_URL`.

Default: `http://localhost:3000`

Ensure your backend provides these endpoints:

### Health Check
```
GET /health
```

### Authentication
```
POST /auth/register
POST /auth/login
GET /auth/me
```

### Resources
```
GET/POST /users
GET/POST /activities
GET/POST /submissions
POST /submissions/:id/approve
POST /submissions/:id/reject
GET/POST /rewards
GET/POST /redemptions
PATCH /redemptions/:id/complete
```

## Folder Structure At-a-Glance

```
src/
├── pages/          # Route pages (landing, auth, student, reviewer, admin)
├── components/     # Reusable UI (Layout, Navigation, Toast, etc.)
├── context/        # State management (Auth, Notifications)
├── hooks/          # Custom hooks (useAuth, useApiCall, useNotification)
├── services/       # API client with 30+ methods
├── types/          # TypeScript interfaces
├── utils/          # Validators, helpers, utilities
├── App.tsx         # Main routing
└── index.css       # Global styles
```

## Common Tasks

### Add a New Page

1. Create file: `src/pages/NewPage.tsx`
2. Import in `src/App.tsx`
3. Add route in `<Routes>`
4. Use `Layout` component for consistent styling

```tsx
import Layout from '@/components/Layout'

export default function NewPage() {
  return (
    <Layout>
      <h1>My Page</h1>
    </Layout>
  )
}
```

### Add API Endpoint

1. Add method to `src/services/api.ts`:
```typescript
async getNewResource(id: string) {
  const response = await this.client.get(`/new-resource/${id}`)
  return response.data
}
```

2. Create custom hook in `src/hooks/`:
```typescript
export const useNewResource = (id: string) => {
  const [data, setData] = useState(null)
  // ... implement hook
}
```

### Add Form Validation

1. Define Zod schema in `src/utils/validators.ts`:
```typescript
export const mySchema = z.object({
  field: z.string().min(3),
})
```

2. Use in form with React Hook Form:
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const { register, errors } = useForm({
  resolver: zodResolver(mySchema)
})
```

### Show Notification

```tsx
import { useNotificationContext } from '@/hooks/useNotificationContext'

const notify = useNotificationContext()

// Success with transaction hash
notify.success('Operation complete', 'tx_hash_here')

// Error
notify.error('Something went wrong')

// Info
notify.info('Please note...')

// Warning
notify.warning('Be careful...')
```

### Access User Info

```tsx
import { useAuth } from '@/hooks/useAuth'

const { user, isAuthenticated, logout } = useAuth()

if (!isAuthenticated) {
  // User not logged in
}

console.log(user?.name, user?.email, user?.role)
```

### Make API Call

```tsx
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

const notify = useNotificationContext()

try {
  const data = await apiClient.listActivities(1, 20)
  console.log(data)
} catch (error) {
  notify.error(apiClient.getErrorMessage(error))
}
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_STELLAR_EXPLORER_URL=https://soroban-testnet.stellar.expert
```

## Color Scheme

Primary colors defined in `tailwind.config.ts`:
- **Primary**: #2563eb (blue)
- **Secondary**: #1e40af (dark blue)
- **Success**: #10b981 (green)
- **Warning**: #f59e0b (amber)
- **Error**: #dc2626 (red)
- **Muted**: #6b7280 (gray)

Use with Tailwind classes:
```tsx
<div className="bg-primary text-white">Primary</div>
<div className="bg-success text-white">Success</div>
```

## Common Tailwind Classes

```tsx
// Layout
<div className="flex items-center justify-between">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Spacing
<div className="p-4 m-2 mb-8">
<div className="px-4 py-2">

// Colors
<div className="bg-primary text-white">
<div className="border border-border">

// Typography
<h1 className="text-3xl font-bold">
<p className="text-muted text-sm">

// Interactive
<button className="btn-primary">
<input className="input-field">
<div className="card p-8">
```

## Common Patterns

### Loading State
```tsx
const [loading, setLoading] = useState(true)

// ... set loading state in useEffect

if (loading) return <p>Loading...</p>
```

### Error Handling
```tsx
try {
  // API call
} catch (error) {
  notify.error(apiClient.getErrorMessage(error))
}
```

### Protected Component
```tsx
import { useAuth } from '@/hooks/useAuth'

export default function AdminOnly() {
  const { user } = useAuth()
  
  if (user?.role !== 'ADMIN') {
    return <div>Access Denied</div>
  }
  
  return <div>Admin Content</div>
}
```

### Search/Filter
```tsx
const [search, setSearch] = useState('')
const [category, setCategory] = useState('')

const filtered = items.filter(item =>
  item.title.includes(search) &&
  (!category || item.category === category)
)
```

## Debugging

### Check Authentication State
```tsx
import { useAuth } from '@/hooks/useAuth'

const { user, token, isAuthenticated } = useAuth()
console.log({ user, token, isAuthenticated })
```

### Check API Connection
Visit `/` and check the "System Status" section for health check results.

### Browser DevTools
- Use Network tab to inspect API calls
- Use Application tab to view localStorage (auth_token)
- Check Console for error messages

### Enable Debug Logging
Add to API client calls:
```tsx
console.log('[API] Request:', method, url)
console.log('[API] Response:', data)
```

## Testing

### Run Single Test File
```bash
pnpm test -- src/utils/validators.test.ts
```

### Run E2E Tests with UI
```bash
pnpm test:e2e:ui
```

### Run Tests in Watch Mode
```bash
pnpm test -- --watch
```

## Performance Tips

1. Use layout shift prevention on images
2. Lazy load heavy components with React.lazy()
3. Memoize expensive computations with useMemo()
4. Use React Router's code splitting
5. Minimize re-renders with proper hook dependencies

## Security Checklist

✅ JWT tokens stored securely  
✅ Authorization header on API calls  
✅ Client-side validation with Zod  
✅ Password minimum length enforced  
✅ HTTPS ready (configure on deployment)  
✅ CORS handled by backend  
✅ Input validation on forms  
✅ Protected routes based on authentication  

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5173 in use | Vite will auto-select another port |
| API connection fails | Check VITE_API_BASE_URL in .env.local |
| Styles not loading | Clear cache: Ctrl+Shift+R |
| Tests fail | Run `pnpm install` and try again |
| TypeScript errors | Run `pnpm tsc` to check types |

## Useful Links

- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Zod Docs](https://zod.dev/)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Axios Docs](https://axios-http.com/)

## File You'll Edit Most

1. **src/pages/** - Add new pages
2. **src/components/** - Create UI components
3. **src/services/api.ts** - Add API methods
4. **src/utils/validators.ts** - Add validation rules
5. **tailwind.config.ts** - Customize styling

## Key Concepts

- **React Router**: Handles page navigation
- **Context API**: Manages global state (auth, notifications)
- **Hooks**: Encapsulate reusable logic
- **Zod**: Runtime type validation
- **Axios**: HTTP client
- **Tailwind**: Utility-first CSS

## Deployment Commands

```bash
# Vercel
vercel deploy

# Docker
docker build -t school-rewards .
docker run -p 3000:3000 school-rewards

# Static host
pnpm build
# Upload dist/ folder
```

## Need Help?

1. Check [README.md](./README.md) for detailed docs
2. Check [SETUP.md](./SETUP.md) for setup issues
3. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture
4. Review example code in existing pages
5. Check TypeScript error messages
6. Search GitHub issues for similar problems

---

**Last Updated**: 2024  
**Status**: Production Ready  
**Version**: 1.0.0
