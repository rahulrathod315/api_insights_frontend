# API Insights Frontend

A React frontend for the API Insights application, built with Vite.

## Project Structure

```
src/
├── App.jsx           # Main App component
├── App.css           # App styles
├── main.jsx          # Entry point
├── index.css         # Global styles
└── api.js            # API client configuration
```

## Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

The default API URL is `http://localhost:8000/api`. Update if your backend runs on a different address.

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### API Communication

Use the `api` client from `src/api.js` for all API requests:

```jsx
import apiClient from './api'

// GET request
const response = await apiClient.get('/endpoint')

// POST request
const data = await apiClient.post('/endpoint', { /* data */ })
```

The client automatically:
- Adds JWT token from localStorage as Authorization header
- Redirects to login on 401 responses
- Proxies requests to the backend (configured in vite.config.js)

## Building

Create a production build:

```bash
npm run build
```

Output will be in the `dist/` directory.

## Backend Integration

The backend is a Django REST Framework API located at `../Back-end`.

Key backend apps:
- `accounts` - User authentication & management
- `projects` - Project management
- `analytics` - API analytics & monitoring
- `audit` - Audit logging
- `payments` - Payment processing (Stripe)
- `api_insights` - Core analytics features

Ensure the backend is running before development:

```bash
cd ../Back-end
python manage.py runserver
```
