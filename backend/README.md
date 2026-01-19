# Organix Backend API

Backend server for the Organix organ donation platform built with Node.js, Express, and Supabase.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # Supabase client setup
│   │   └── server.js    # Server configuration
│   ├── controllers/     # Request handlers
│   │   ├── authController.js
│   │   ├── caseController.js
│   │   ├── donorSponsorController.js
│   │   └── adminController.js
│   ├── middlewares/     # Express middlewares
│   │   ├── auth.js      # Authentication & authorization
│   │   └── logger.js    # Request logging
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── caseRoutes.js
│   │   ├── donorRoutes.js
│   │   ├── sponsorRoutes.js
│   │   └── adminRoutes.js
│   ├── services/        # Business logic layer
│   │   ├── authService.js
│   │   ├── caseService.js
│   │   ├── donorSponsorService.js
│   │   ├── adminService.js
│   │   └── auditService.js
│   └── index.js         # Main server file
├── .env.example         # Environment variables template
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- PostgreSQL database (via Supabase)

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

### Running the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Sign in user
- `GET /auth/session` - Get current session (auth required)
- `POST /auth/signout` - Sign out user (auth required)

### Cases
- `POST /cases` - Create new case (patients only)
- `GET /cases` - Get cases (filtered by role)
- `PUT /cases/:caseId` - Update case (hospitals/admins only)

### Donor
- `POST /donor/consent` - Update consent
- `GET /donor/profile` - Get donor profile

### Sponsor
- `POST /sponsor/fund` - Fund a case
- `GET /sponsor/stats` - Get funding statistics

### Admin
- `GET /admin/pending` - Get users pending approval
- `POST /admin/approve` - Approve user
- `GET /admin/audit` - Get audit logs
- `GET /admin/stats` - Get system statistics

### Health Check
- `GET /health` - Server health status

## 🔐 Authentication

All endpoints except `/auth/signup`, `/auth/signin`, and `/health` require authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

## 🏗️ Architecture

### Clean Architecture Layers:

1. **Routes** - Define API endpoints and map to controllers
2. **Controllers** - Handle HTTP requests/responses
3. **Services** - Business logic and data operations
4. **Config** - Configuration and external service clients
5. **Middlewares** - Cross-cutting concerns (auth, logging, error handling)

### Data Flow:
```
Request → Route → Middleware → Controller → Service → Database
Response ← Controller ← Service ← Database
```

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `PORT` | Server port (default: 3001) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `CORS_ORIGIN` | Allowed CORS origin | No |

## 🛠️ Development

### Code Organization

- **Controllers**: Handle HTTP layer, validate requests, format responses
- **Services**: Contain business logic, database operations
- **Middlewares**: Authentication, logging, error handling
- **Config**: External service configurations

### Adding New Endpoints

1. Create service method in `/services`
2. Create controller method in `/controllers`
3. Add route in `/routes`
4. Import and use route in `src/index.js`

## 📝 Database

The backend uses Supabase PostgreSQL with Row Level Security (RLS).

**Tables:**
- users
- patients
- donors
- hospitals
- sponsors
- cases
- case_sponsors
- audit_logs

See `/supabase/migrations/001_initial_schema.sql` for complete schema.

## 🐛 Error Handling

All errors are caught and formatted consistently:
```json
{
  "error": "Error message"
}
```

HTTP status codes:
- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

## 📊 Logging

Request logging format:
```
2026-01-19T12:00:00.000Z - POST /auth/signin
```

## 🔒 Security

- JWT authentication via Supabase
- Row Level Security (RLS) on database
- Service role key for elevated permissions
- CORS configuration
- Input validation

## 🧪 Testing

(To be implemented)

```bash
npm test
```

## 📦 Dependencies

- **express** - Web framework
- **@supabase/supabase-js** - Supabase client
- **cors** - CORS middleware
- **dotenv** - Environment variable management

## 🤝 Contributing

1. Follow the existing code structure
2. Use ES6 modules (`import`/`export`)
3. Add JSDoc comments to functions
4. Handle errors properly
5. Log important operations

## 📄 License

ISC
