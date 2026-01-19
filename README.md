# Organix - Organ Donation Platform

A full-stack web application for managing organ donations, connecting patients, donors, hospitals, and sponsors.

## 📋 Overview

Organix is a comprehensive platform that facilitates the organ donation process by:
- **Patients**: Creating and tracking transplant cases
- **Donors**: Registering and managing donation consent
- **Hospitals**: Matching donors with patients and managing cases
- **Sponsors**: Providing financial support for transplant cases
- **Admins**: Overseeing the entire platform and approving users

## 🏗️ Architecture

This is a **clean full-stack monorepo** with separated frontend and backend:

```
OrganixApp/
├── frontend/          # React + Vite application
├── backend/           # Node.js + Express API
├── supabase/          # Database migrations
└── README.md          # This file
```

### Technology Stack

**Frontend:**
- React 18.3
- Vite 6.3
- TailwindCSS 4.1
- Radix UI
- TypeScript

**Backend:**
- Node.js
- Express 4.21
- Supabase (PostgreSQL)
- JWT Authentication

**Database:**
- PostgreSQL (via Supabase)
- Row Level Security (RLS)
- Audit logging

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Two terminal windows

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd OrganixApp
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

Backend runs on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Database Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to SQL Editor
3. Run the migration file: `/supabase/migrations/001_initial_schema.sql`

## 📁 Project Structure

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/    # React components
│   │   ├── utils/         # Utilities
│   │   └── App.tsx        # Main app
│   ├── services/
│   │   └── api.js         # ⭐ Centralized API calls
│   ├── styles/            # Global styles
│   └── main.tsx           # Entry point
├── index.html
├── vite.config.ts
└── package.json
```

**Key Feature:** All API calls centralized in `/src/services/api.js`

### Backend (`/backend`)

```
backend/
├── src/
│   ├── config/            # Configuration
│   │   ├── database.js    # Supabase client
│   │   └── server.js      # Server config
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middlewares/       # Auth, logging, errors
│   └── index.js           # Main server
└── package.json
```

**Clean Architecture:** Routes → Controllers → Services → Database

### Database (`/supabase`)

```
supabase/
└── migrations/
    └── 001_initial_schema.sql    # Complete database schema
```

## 🔑 Environment Variables

### Backend (`.env`)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001
```

## 📡 API Endpoints

All endpoints are prefixed with `http://localhost:3001`

### Authentication
- `POST /auth/signup` - Register
- `POST /auth/signin` - Login
- `GET /auth/session` - Get session
- `POST /auth/signout` - Logout

### Cases
- `GET /cases` - List cases
- `POST /cases` - Create case
- `PUT /cases/:id` - Update case

### Donor
- `GET /donor/profile` - Get profile
- `POST /donor/consent` - Update consent

### Sponsor
- `POST /sponsor/fund` - Fund case
- `GET /sponsor/stats` - Get stats

### Admin
- `GET /admin/pending` - Pending approvals
- `POST /admin/approve` - Approve user
- `GET /admin/audit` - Audit logs
- `GET /admin/stats` - System stats

See detailed API documentation in `/backend/README.md`

## 📚 Documentation

- [Backend Documentation](./backend/README.md) - API, architecture, deployment
- [Frontend Documentation](./frontend/README.md) - Components, API integration, styling
- [Database Schema](./supabase/migrations/001_initial_schema.sql) - Complete schema with comments

## 🛠️ Development

### Running Both Servers

**Option 1: Two terminals**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## 🚢 Deployment

### Backend Deployment

**Recommended:** Railway, Render, or Heroku

1. Push backend folder to repository
2. Set environment variables
3. Set start command: `npm start`
4. Deploy

### Frontend Deployment

**Recommended:** Vercel or Netlify

1. Push frontend folder to repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set `VITE_API_URL` environment variable
5. Deploy

### Database

Supabase is already cloud-hosted. No additional deployment needed.

## 🔒 Security

- JWT authentication
- Row Level Security (RLS) on database
- Service role key for backend only (never exposed to frontend)
- CORS configuration
- Input validation
- Audit logging

## 📝 License

ISC

---

**Built for the organ donation community**
