# Organix Frontend

Frontend application for the Organix organ donation platform built with React, Vite, and TailwindCSS.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/      # React components
│   │   │   ├── AuthPage.tsx
│   │   │   ├── PatientDashboard.tsx
│   │   │   ├── DonorDashboard.tsx
│   │   │   ├── HospitalDashboard.tsx
│   │   │   ├── SponsorDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── figma/       # Figma-imported components
│   │   │   └── ui/          # UI component library
│   │   ├── utils/           # Utilities
│   │   └── App.tsx          # Main app component
│   ├── services/            # API service layer
│   │   └── api.js           # Centralized API calls
│   ├── styles/              # Global styles
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   ├── fonts.css
│   │   └── theme.css
│   └── main.tsx             # App entry point
├── index.html
├── vite.config.ts
├── postcss.config.mjs
├── .env.example
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running (see `/backend/README.md`)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
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
   VITE_API_URL=http://localhost:3001
   ```

### Running the App

**Development mode:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

The app will start on `http://localhost:5173`

## 🌐 API Integration

All API calls are centralized in `/src/services/api.js`.

### Using the API Service

```javascript
import { authAPI, caseAPI } from '../services/api';

// Sign in
const result = await authAPI.signin(email, password);

// Get cases
const cases = await caseAPI.getCases();

// Create case
const newCase = await caseAPI.createCase(organNeeded, urgencyLevel, notes);
```

### Available API Methods

**Authentication:**
- `authAPI.signup(email, password, name, role)`
- `authAPI.signin(email, password)`
- `authAPI.getSession()`
- `authAPI.signout()`

**Cases:**
- `caseAPI.getCases()`
- `caseAPI.createCase(organNeeded, urgencyLevel, notes)`
- `caseAPI.updateCase(caseId, updates)`

**Donor:**
- `donorAPI.getProfile()`
- `donorAPI.updateConsent(donorType, consentGiven)`

**Sponsor:**
- `sponsorAPI.fundCase(caseId, amount)`
- `sponsorAPI.getStats()`

**Admin:**
- `adminAPI.getPendingApprovals()`
- `adminAPI.approveUser(userId)`
- `adminAPI.getAuditLogs()`
- `adminAPI.getSystemStats()`

### Authentication Token

The API service automatically manages authentication tokens:

```javascript
import { setAuthToken } from '../services/api';

// After successful login
const result = await authAPI.signin(email, password);
setAuthToken(result.accessToken);

// On logout
setAuthToken(null);
```

## 🎨 UI Components

The app uses Radix UI primitives with custom styling:

- **Radix UI** - Accessible component primitives
- **TailwindCSS** - Utility-first CSS
- **Lucide React** - Icon library
- **MUI** - Material UI components

### Component Library

Located in `/src/app/components/ui/`:
- Buttons, Inputs, Dialogs
- Cards, Tables, Tabs
- Form components
- Navigation components
- And more...

## 📱 User Roles & Dashboards

### Patient Dashboard
- View and create organ transplant cases
- Track case status
- View funding progress

### Donor Dashboard
- Give or withdraw organ donation consent
- Specify donor type (living/deceased)
- View available cases (anonymized)

### Hospital Dashboard
- View unassigned and assigned cases
- Match donors to patients
- Update case status

### Sponsor Dashboard
- Browse cases needing funding
- Fund cases financially
- View funding history and statistics

### Admin Dashboard
- Approve hospitals and sponsors
- View system statistics
- Access audit logs
- Manage all users and cases

## 🔑 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | `http://localhost:3001` |

## 🛠️ Development

### Code Organization

- **components/** - Reusable React components
- **services/** - API integration layer (NO business logic)
- **utils/** - Utility functions
- **styles/** - Global CSS and themes

### Best Practices

1. **API Calls** - Always use the centralized API service in `/services/api.js`
2. **No Backend Logic** - Frontend only handles UI and calls APIs
3. **Environment Variables** - Use `import.meta.env.VITE_*` for config
4. **Type Safety** - TypeScript for type checking
5. **Component Reusability** - Use UI component library

### Adding New Features

1. Create/update API method in `/services/api.js`
2. Create/update component in `/app/components/`
3. Import and use API methods in component

## 📦 Key Dependencies

### Core
- **react** ^18.3.1 - UI library
- **react-dom** ^18.3.1 - React DOM rendering
- **vite** ^6.3.5 - Build tool

### UI Libraries
- **@radix-ui/react-*** - Accessible UI primitives
- **@mui/material** - Material UI components
- **lucide-react** - Icons
- **tailwindcss** - Utility CSS

### Utilities
- **date-fns** - Date formatting
- **recharts** - Charts and graphs
- **react-hook-form** - Form management

## 🎨 Styling

### TailwindCSS

Utility-first CSS framework. Example:

```tsx
<div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
  <h1 className="text-2xl font-bold">Title</h1>
</div>
```

### Custom Themes

Located in `/src/styles/theme.css`:
- CSS variables for colors
- Dark/light mode support
- Custom Tailwind configurations

## 🔒 Security

- **No API Keys** - Never store API keys or secrets in frontend
- **Token Storage** - Access tokens stored in localStorage
- **Environment Variables** - Use `.env` for configuration
- **HTTPS** - Use HTTPS in production

## 🐛 Debugging

### Common Issues

1. **API Connection Failed**
   - Ensure backend is running on correct port
   - Check `VITE_API_URL` in `.env`

2. **Authentication Errors**
   - Clear localStorage
   - Re-login to get fresh token

3. **Build Errors**
   - Delete `node_modules` and reinstall
   - Clear Vite cache: `rm -rf node_modules/.vite`

## 🚀 Deployment

### Build

```bash
npm run build
```

Output in `/dist` directory.

### Environment Variables for Production

Set `VITE_API_URL` to your production API URL:
```env
VITE_API_URL=https://api.yourapp.com
```

### Deploy to Vercel/Netlify

1. Connect your repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL`

## 🧪 Testing

(To be implemented)

```bash
npm test
```

## 🤝 Contributing

1. Follow existing component structure
2. Use TypeScript for new components
3. Centralize all API calls in `/services/api.js`
4. Keep components focused and reusable
5. Use TailwindCSS for styling

## 📄 License

ISC
