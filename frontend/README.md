# Volunteer Management System - Frontend

React frontend for the volunteer management system.

## Features

### Volunteer Interface
- Dashboard with personal stats
- Work log creation and tracking
- Project proposal submission
- Document upload and management
- View signed documents from NGO

### Admin Interface
- Admin dashboard with system overview
- Approve/reject work hours
- Review project proposals
- Document management
- User oversight

## Setup Instructions

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

The app will run on http://localhost:3000 and proxy API requests to the Django backend on http://localhost:8000.

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AdminDashboard.js
│   │   ├── Dashboard.js
│   │   ├── Documents.js
│   │   ├── Login.js
│   │   ├── Navbar.js
│   │   ├── Projects.js
│   │   └── WorkLogs.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── App.js
│   ├── index.js
│   └── index.css
└── package.json
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner

## Authentication

The app uses session-based authentication with the Django backend. Users are automatically redirected based on their authentication status and role.

## API Integration

All API calls are made through axios with the backend proxy configured in package.json. The AuthContext manages user state and authentication across the application.
