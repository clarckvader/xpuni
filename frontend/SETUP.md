# School Rewards App - Setup Guide

## Overview

This guide walks you through setting up and running the School Rewards frontend application. The app is built with Vite + React + TypeScript and requires a running backend API.

## Prerequisites

- Node.js 18.0 or higher
- pnpm 8.0 or higher (or npm/yarn)
- A running instance of the School Rewards backend API
- Git

## Step 1: Clone or Download the Project

```bash
# If cloning from GitHub
git clone https://github.com/yourusername/school-rewards.git
cd school-rewards

# Or if you have a zip file
unzip school-rewards.zip
cd school-rewards
```

## Step 2: Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and update the variables:

```env
# Backend API URL - change to your backend server
VITE_API_BASE_URL=http://localhost:3000

# Stellar Explorer URL for testnet/mainnet
VITE_STELLAR_EXPLORER_URL=https://soroban-testnet.stellar.expert
```

## Step 4: Start the Development Server

```bash
pnpm dev
```

The app will start on `http://localhost:5173` (or another port if 5173 is in use).

Open your browser and navigate to the URL shown in the terminal.

## Step 5: Verify the Setup

1. You should see the landing page with "School Rewards" title
2. The "System Status" section should show a health check result
3. Try navigating to "/login" to verify routing works

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Open test UI
pnpm test:ui
```

### E2E Tests

```bash
# Run E2E tests (requires dev server running)
pnpm test:e2e

# Open E2E test UI
pnpm test:e2e:ui
```

## Building for Production

```bash
# Build the app
pnpm build

# Preview the production build locally
pnpm preview
```

The build output will be in the `dist/` directory.

## Linting and Code Style

```bash
# Run ESLint
pnpm lint

# Fix lint errors automatically
pnpm lint -- --fix
```

## Project Structure Overview

```
├── src/
│   ├── pages/           # Route pages (organized by role)
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context (auth, notifications)
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API client
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Utilities (validators, helpers)
│   ├── App.tsx         # Main app with routing
│   └── main.tsx        # Entry point
├── tests/
│   └── e2e/            # End-to-end tests
├── public/             # Static assets
├── index.html          # HTML entry point
├── tailwind.config.ts  # Tailwind configuration
├── vite.config.ts      # Vite configuration
└── README.md           # Full documentation
```

## Backend Requirements

The frontend expects a REST API with the following endpoints. Ensure your backend is running and exposes these endpoints:

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user profile

### Activities
- `GET /activities?page=1&limit=20&search=...` - List activities
- `GET /activities/:id` - Get activity details
- `POST /activities` - Create activity (admin only)
- `PATCH /activities/:id` - Update activity (admin only)
- `DELETE /activities/:id` - Delete activity (admin only)

### Submissions
- `GET /submissions?page=1&limit=20&status=...` - List submissions
- `GET /submissions/:id` - Get submission details
- `POST /submissions` - Submit proof (multipart/form-data)
- `POST /submissions/:id/approve` - Approve submission (reviewer only)
- `POST /submissions/:id/reject` - Reject submission (reviewer only)

### Rewards
- `GET /rewards?page=1&limit=20` - List rewards
- `GET /rewards/:id` - Get reward details
- `POST /rewards` - Create reward (admin only)
- `PATCH /rewards/:id` - Update reward (admin only)
- `DELETE /rewards/:id` - Delete reward (admin only)

### Redemptions
- `GET /redemptions?page=1&limit=20&status=...` - List redemptions
- `GET /redemptions/:id` - Get redemption details
- `POST /redemptions` - Create redemption
- `PATCH /redemptions/:id/complete` - Mark as complete (admin only)

### Health Check
- `GET /health` - Backend health status

## Common Setup Issues

### Issue: "Cannot find module 'react'"

**Solution**: Run `pnpm install` to ensure all dependencies are installed.

### Issue: "VITE_API_BASE_URL is not defined"

**Solution**: Create `.env.local` file and set the `VITE_API_BASE_URL` variable.

### Issue: "Backend connection refused"

**Solution**: 
- Check if backend is running
- Verify the `VITE_API_BASE_URL` matches your backend URL
- Check CORS configuration on the backend

### Issue: "Port 5173 is already in use"

**Solution**: Vite will automatically use a different port. Check the terminal output for the actual URL.

## Development Workflow

1. **Create a new page**:
   - Add file in `src/pages/`
   - Import in `App.tsx` and add route

2. **Create a new component**:
   - Add file in `src/components/`
   - Import and use in pages

3. **Add API functionality**:
   - Update `src/services/api.ts` with endpoint
   - Create custom hook in `src/hooks/`
   - Use hook in component

4. **Add validation**:
   - Define Zod schema in `src/utils/validators.ts`
   - Use in form with `react-hook-form`

5. **Style components**:
   - Use Tailwind CSS classes
   - Follow the design tokens in `tailwind.config.ts`
   - Use custom CSS classes from `src/index.css`

## Deployment

### Vercel

1. Push code to GitHub
2. Connect GitHub repository to Vercel
3. Set environment variables in Vercel project settings
4. Deploy

### Docker

```dockerfile
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm build

FROM node:18
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:
```bash
docker build -t school-rewards .
docker run -p 3000:3000 -e VITE_API_BASE_URL=http://your-api.com school-rewards
```

## Getting Help

- Check [README.md](./README.md) for detailed documentation
- Review code comments in source files
- Check [Vite docs](https://vitejs.dev/)
- Review [React docs](https://react.dev/)
- Check [Tailwind docs](https://tailwindcss.com/)

## Next Steps

After setup:

1. Test the health check on the landing page
2. Try creating a user account
3. Explore the student dashboard
4. Test file uploads and submissions
5. Review the code structure
6. Customize styles and branding

Good luck! 🚀
