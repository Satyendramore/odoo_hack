# AssetFlow — Frontend

The frontend for **AssetFlow**, an ERP-style asset and resource management platform. Built with React and Vite, it talks to a Spring Boot backend for authentication, asset tracking, allocations, bookings, maintenance, and reporting.

## Tech Stack

- **React 18** — UI library
- **Vite 5** — dev server and build tool
- **React Router 6** — client-side routing and route guards
- **Axios** — HTTP client with JWT interceptors
- **Bootstrap 5** — UI styling

## Prerequisites

- Node.js (v18+ recommended) and npm
- The [AssetFlow backend](../backend) running locally on `http://localhost:8080` (or a deployed backend URL)

## Getting Started

```bash
# from the assetflow-frontend directory
npm install
npm run dev
```

The app will be available at `http://localhost:5173` by default.

## Available Scripts

| Command           | Description                              |
|--------------------|-------------------------------------------|
| `npm run dev`      | Start the Vite dev server with hot reload |
| `npm run build`    | Build a production bundle to `dist/`      |
| `npm run preview`  | Preview the production build locally      |

## Environment Variables

The frontend talks to the backend API via `/api`.

- In **development**, `vite.config.js` proxies all `/api/*` requests to `http://localhost:8080` (the backend already serves under an `/api` context path).
- In **production**, set `VITE_API_BASE_URL` to your deployed backend URL, e.g.:

```bash
VITE_API_BASE_URL=https://your-backend.example.com/api
```

If unset, the app falls back to a relative `/api` base URL (see `src/api.js`).

## Project Structure

```
assetflow-frontend/
├── src/
│   ├── api.js              # Axios instance: JWT header injection, 401 handling
│   ├── App.jsx              # Route definitions and auth/role guards
│   ├── main.jsx              # App entry point
│   ├── AuthContext.jsx       # Auth state (user, token, login/logout) via localStorage
│   ├── ThemeContext.jsx      # Theme (light/dark) context
│   ├── mockData.jsx          # Sample/mock data used during UI development
│   ├── components/
│   │   ├── Layout.jsx         # Shared app shell (sidebar + topbar + outlet)
│   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   └── Topbar.jsx         # Top navigation bar
│   └── pages/
│       ├── Login.jsx
│       ├── Signup.jsx
│       ├── ForgotPassword.jsx
│       ├── Dashboard.jsx
│       ├── OrgSetup.jsx        # Admin-only
│       ├── Assets.jsx
│       ├── Allocation.jsx
│       ├── Booking.jsx
│       ├── Maintaince.jsx
│       ├── Reports.jsx
│       ├── Notification.jsx
│       └── Audit.jsx
├── index.html
├── index.css
├── vite.config.js
└── package.json
```

## Routing & Auth

Routing is defined in `src/App.jsx`:

- **Public routes:** `/login`, `/signup`, `/forgot-password`
- **Protected routes** (wrapped in the shared `Layout`): `/dashboard`, `/assets`, `/allocations`, `/bookings`, `/maintenance`, `/reports`, `/notifications`, `/audit`
- **Admin-only route:** `/org-setup`
- Unknown paths redirect to `/dashboard`

Authentication state is managed by `AuthContext` (`src/AuthContext.jsx`), which persists the JWT and user object to `localStorage` and exposes `login`/`logout` helpers. `src/api.js` automatically attaches the stored JWT as a `Bearer` token to every request and redirects to `/login` on a `401` response.

> **Note:** `App.jsx` currently has a `BYPASS_AUTH` flag set to `true`, which disables route guards for easier local development. Set it to `false` to enforce authentication and role-based access before deploying.

## Building for Production

```bash
npm run build
```

This outputs a production-ready bundle to `dist/`, which can be served by any static file host or reverse-proxied alongside the backend.