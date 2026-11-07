# Rajasthan Civic Connect — React Frontend

The frontend for Rajasthan Civic Connect is built using React 19 and Vite 8, styled with Bootstrap 5 and modern CSS, delivering an accessible, responsive, single-page application (SPA) for citizens, department officers, and system administrators.

---

## Technology Stack

- **Framework:** React 19 (`react`, `react-dom`)
- **Bundler / Dev Server:** Vite 8 (`@vitejs/plugin-react`)
- **UI & Styling:** Bootstrap 5, Bootstrap Icons, custom responsive CSS
- **Interactive Maps:** Leaflet 1.9, React-Leaflet 5
- **HTTP Client:** Modern browser `fetch` via centralized `src/apiService.js`
- **Authentication:** Stateless JWT stored securely in `localStorage`

---

## Directory Structure

```text
frontend/
├── public/
│   ├── favicon.svg                   # Application favicon
│   └── data/
│       └── rajasthan-ulbs.json       # Rajasthan districts & Urban Local Bodies (ULBs)
├── src/
│   ├── assets/                       # Static branding images (e.g., rajasthan_smart_city.png)
│   ├── components/                   # Reusable UI components
│   │   ├── Navbar.jsx                # Global navigation bar with role badge & auth toggle
│   │   ├── Footer.jsx                # Official Rajasthan Government civic footer
│   │   ├── HeroSection.jsx           # Landing hero banner with quick CTA buttons
│   │   ├── CivicProblems.jsx         # Highlighted civic problems and categories
│   │   ├── CivicWorkflow.jsx         # 4-stage governance resolution lifecycle
│   │   ├── CitizenDashboard.jsx      # Citizen dashboard with stats and activity
│   │   ├── OfficerDashboard.jsx      # Department officer queue with status actions
│   │   ├── AdminDashboard.jsx        # Admin governance, metrics, officer provisioning
│   │   ├── ComplaintCenter.jsx       # Grievance lodging form with media & GPS
│   │   ├── MyComplaints.jsx          # Citizen grievance history & timeline tracking
│   │   ├── LoginRegister.jsx         # Combined login & citizen registration modal
│   │   └── ProfilePreview.jsx        # User profile inspection and password change
│   ├── apiService.js                 # Centralized API layer with environment binding
│   ├── App.jsx                       # Main application shell and routing state
│   ├── App.css                       # Application layout & component styling
│   └── main.jsx                      # React 19 entry point
├── .env.example                      # Environment variables template
├── index.html                        # HTML entry point with meta tags & icons
├── package.json                      # Dependencies and npm scripts
└── vite.config.js                    # Vite configuration
```

---

## Local Setup & Development

### Prerequisites
- Node.js v18.0.0 or higher
- npm (included with Node.js)

### Configuration
Create `.env.local` (ignored by Git) based on `.env.example`:

```properties
VITE_API_BASE_URL=http://localhost:8080/api
```

### Installation & Execution
```powershell
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The application will be accessible at: `http://localhost:5173`

### Production Build
```powershell
npm run build
```
This generates optimized, production-ready static assets in `dist/`.

---

## Key Features

1. **Role-Based Portals:**
   - **Citizen:** Lodge complaints with geo-tagging, photo attachment, offline draft autosave, track live progress.
   - **Department Officer:** View grievances scoped exclusively to assigned municipal department (Water, Sanitation, etc.); update status with official remarks.
   - **Administrator:** Comprehensive state-level dashboard with aggregate metrics, officer assignment, and department management.

2. **Zero Hardcoded Endpoints:**
   All API communication is driven by `src/apiService.js` using `import.meta.env.VITE_API_BASE_URL` with a sensible fallback for local development.

3. **Responsive Design:**
   Fluid layout tested and verified across desktop (1366x768) and mobile viewports (390x844).

---

## Production Deployment (Vercel)

The frontend is deployed to Vercel as a Single Page Application:
- **Project Name:** `rajasthan-civic-connect`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_BASE_URL=https://civic-connect-api-bw8t.onrender.com/api`
- **Live Domain:** `https://rajasthan-civic-connect.vercel.app`
