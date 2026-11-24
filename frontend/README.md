# Rajasthan Civic Connect — React Frontend

Responsive single-page application (SPA) for citizen grievance redressal and municipal governance.

## Tech Stack
- **Framework:** React 19 (`react`, `react-dom`)
- **Bundler:** Vite 8 (`@vitejs/plugin-react`)
- **UI & Styling:** Bootstrap 5, Bootstrap Icons, responsive CSS
- **HTTP Client:** Browser `fetch` centralized in `src/apiService.js`
- **State & Storage:** React hooks, `localStorage` for JWT session tokens

## Directory Structure
- `src/components/`: UI components (Navbar, HeroSection, ComplaintCenter, AdminDashboard, OfficerDashboard, etc.)
- `src/apiService.js`: Unified API service communicating with Spring Boot backend
- `src/validators.js`: Input validation helpers (10-digit mobile rule)
- `public/data/rajasthan-ulbs.json`: Deterministic Rajasthan districts, ULBs, and wards dataset

## Local Development
1. Create `frontend/.env.local`:
   ```properties
   VITE_API_BASE_URL=http://localhost:8080/api
   ```
2. Install dependencies & run:
   ```powershell
   npm install
   npm run dev
   ```
3. Build for production:
   ```powershell
   npm run build
   ```
- Local Web UI: `http://localhost:5173`

## Production Deployment
Deployed on Vercel Edge Network: `https://rajasthan-civic-connect.vercel.app`.

Last deployment check: 2026-11-24 18:02

