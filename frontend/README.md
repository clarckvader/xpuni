# School Rewards Application

A full-featured, role-based web application for gamifying learning with blockchain integration. Students complete activities, submit proof, earn points, and redeem rewards. Reviewers approve submissions, and administrators manage users, activities, and rewards.

## Tech Stack

- **Framework**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS 4.x
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Package Manager**: pnpm

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Create .env.local from .env.example
cp .env.example .env.local

# Update VITE_API_BASE_URL to match your backend
# export VITE_API_BASE_URL=http://localhost:3000
```

### Development

```bash
# Start dev server (runs on http://localhost:5173)
pnpm dev

# Start with preview (production build)
pnpm preview
```

### Building

```bash
# Build for production
pnpm build

# The output will be in the dist/ directory
```

## Project Structure

```
src/
├── pages/              # Route pages organized by role
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Profile.tsx
│   ├── student/        # Student dashboard pages
│   ├── reviewer/       # Reviewer dashboard pages
│   └── admin/          # Admin dashboard pages
├── components/         # Reusable UI components
│   ├── Layout.tsx
│   ├── Navigation.tsx
│   ├── ProtectedRoute.tsx
│   ├── Toast.tsx
│   └── Toaster.tsx
├── context/            # React Context providers
│   ├── AuthContext.tsx
│   └── NotificationContext.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useApiCall.ts
│   ├── useNotification.ts
│   └── useNotificationContext.ts
├── services/           # API client and services
│   └── api.ts         # Axios instance with typed endpoints
├── types/              # TypeScript type definitions
│   └── api.ts         # API request/response types
├── utils/              # Utility functions
│   ├── validators.ts  # Zod validation schemas
│   └── helpers.ts     # Formatting and helper functions
├── App.tsx             # Main app component with routing
├── main.tsx            # Entry point
└── index.css           # Global styles with Tailwind

.env.example            # Environment variables template
vite.config.ts          # Vite configuration
vitest.config.ts        # Unit test configuration
playwright.config.ts    # E2E test configuration
tailwind.config.ts      # Tailwind CSS configuration
```

## Environment Variables

Create a `.env.local` file from `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_STELLAR_EXPLORER_URL=https://soroban-testnet.stellar.expert
```

## Features

### Authentication
- User registration with role selection (Student, Reviewer, Admin)
- JWT-based login/logout
- Token persistence in localStorage (optional)
- Auto-redirect on 401 errors
- Role-based route protection

### Student Dashboard
- **Activities**: Browse available activities with search and filtering
- **Submissions**: Submit proof for activities (file uploads)
- **Track Status**: View submission approval status
- **Rewards Catalog**: Browse available rewards
- **Redemptions**: Redeem rewards using earned points
- **Balance**: Display on-chain balance and Stellar key

### Reviewer Dashboard
- **Pending Submissions**: Queue of submissions to review
- **Approve/Reject**: Review proof and approve or reject with comments
- **Bulk Actions**: Mass approve or reject submissions

### Admin Dashboard
- **User Management**: Create, update, delete users; assign roles
- **Activity Management**: CRUD operations for activities
- **Reward Management**: CRUD operations with image uploads
- **Redemption Tracking**: Monitor redemptions and mark as complete
- **System Health**: View backend status, database health, and contract IDs

### Notifications
- Toast notifications for success/error messages
- Transaction hash display with copy-to-clipboard
- Auto-dismiss after configurable duration
- Multiple notification types: success, error, info, warning

### Form Validation
- Zod schema validation for client-side checks
- Real-time validation feedback
- Password strength requirements
- File size and type validation

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Hamburger navigation on mobile
- Touch-friendly buttons and inputs
- Readable typography and spacing

## API Integration

The app connects to a REST backend API. Ensure the backend is running and the `VITE_API_BASE_URL` environment variable is set correctly.

### Health Check Endpoint

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "database": "connected",
  "contracts": {
    "badge_issuer": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    "token_admin": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4"
  },
  "rpc_available": true
}
```

### Authentication Endpoints

```
POST /auth/register   - Register new user
POST /auth/login      - Login user
GET  /auth/me         - Get current user profile
```

### Core Endpoints

- `GET/POST /users` - User management
- `GET/POST /activities` - Activity CRUD
- `GET/POST /submissions` - Submission management
- `POST /submissions/:id/approve` - Approve submission
- `POST /submissions/:id/reject` - Reject submission
- `GET/POST /rewards` - Reward management
- `POST /rewards/:id/image` - Upload reward image
- `GET/POST /redemptions` - Redemption management
- `PATCH /redemptions/:id/complete` - Mark redemption complete

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Run tests in UI mode
pnpm test:ui

# Run specific test file
pnpm test src/utils/validators.test.ts

# Watch mode
pnpm test -- --watch
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run specific test file
pnpm test:e2e -- e2e/auth.spec.ts

# Run headed (see browser)
pnpm test:e2e -- --headed
```

## Linting

```bash
# Run ESLint
pnpm lint

# Fix lint errors
pnpm lint -- --fix
```

## Architecture

### Authentication Flow

1. User registers → JWT token returned → stored in context
2. Token included in all API requests (Authorization header)
3. 401 response → token cleared, user redirected to login
4. On app load → restore token from localStorage if available

### Role-Based Access Control

Routes are protected by role:
- `/student/*` - Requires STUDENT role
- `/reviewer/*` - Requires REVIEWER role
- `/admin/*` - Requires ADMIN role

Non-authenticated users are redirected to `/login`.

### Error Handling

- API errors are caught and converted to user-friendly messages
- Network errors show appropriate fallback messages
- Form validation provides real-time feedback
- Transaction errors display transaction hash for debugging

## Manual Integration Checklist

When setting up with your backend, verify:

- [ ] Backend is running on `VITE_API_BASE_URL`
- [ ] Health endpoint returns `status: "ok"`
- [ ] User registration accepts email, name, password, role
- [ ] JWT tokens are issued and accepted in Authorization header
- [ ] Activities endpoint returns paginated activity list
- [ ] File upload endpoints handle multipart/form-data
- [ ] Submission approval/rejection endpoints work
- [ ] Contract IDs are returned in health check
- [ ] Image upload returns file URL
- [ ] Rewards endpoint supports filtering and pagination

## Deployment

### Vercel

```bash
# Push to GitHub
git add .
git commit -m "School Rewards App"
git push origin main

# Connect to Vercel and deploy
# Ensure environment variables are set in Vercel project settings
```

### Docker

```bash
# Build image
docker build -t school-rewards .

# Run container
docker run -p 5173:5173 \
  -e VITE_API_BASE_URL=http://api.example.com \
  school-rewards
```

## Development Tips

### Adding a New Page

1. Create page component in `src/pages/[role]/PageName.tsx`
2. Import in `src/App.tsx` and add route
3. Use `Layout` component for consistent styling
4. Use `useAuth` hook to access user info
5. Use `useNotificationContext` for notifications

### Creating API Hooks

```tsx
// Example: useActivities.ts
import { apiClient } from '@/services/api'
import { useApiCall } from '@/hooks/useApiCall'

export const useActivities = (page = 1) => {
  const { data, loading, error, execute } = useApiCall()

  useEffect(() => {
    execute(() => apiClient.listActivities(page))
  }, [page])

  return { activities: data, loading, error }
}
```

### Form with Validation

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { activitySchema } from '@/utils/validators'

export default function ActivityForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(activitySchema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <p>{errors.title.message}</p>}
    </form>
  )
}
```

## Troubleshooting

### Backend Connection Error

- Verify `VITE_API_BASE_URL` is correct
- Check if backend is running
- Check CORS headers if frontend and backend have different origins
- Look at browser console for detailed error

### Token Not Persisting

- Check if localStorage is enabled in browser
- Set `persistAuth={true}` in AuthProvider
- Clear browser cache if needed

### File Upload Issues

- Verify file size limit on backend matches frontend validation
- Check Content-Type headers in API client
- Use FormData for multipart uploads
- Check server upload directory permissions

### Tests Failing

- Ensure `pnpm install` is run
- Clear `.vitest` cache: `rm -rf node_modules/.vitest`
- Rerun tests: `pnpm test`
- For E2E: ensure app runs on `http://localhost:5173`

## License

MIT
