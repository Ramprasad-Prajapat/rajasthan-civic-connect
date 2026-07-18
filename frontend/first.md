# Technical Specification Prompt: RajCivic Connect Advanced Home Page

Create a modern, professional, responsive, and state-of-the-art **Home Page frontend** for a Rajasthan-level civic complaint management platform named **RajCivic Connect** using **React** and **Bootstrap 5**.

The page must act like a premium SaaS dashboard landing page, introducing the civic platform clearly within **10 seconds** and guiding users to complaint filing, status tracking, analytics, and administrator gateways.

---

## 1. Design & Typography Tokens (CSS Custom System)

Use a clean, professional, and government-tech style. Define these tokens:
- **Font Family**: Google Fonts `'Outfit'`, sans-serif.
- **Primary Color**: Emerald Green (`#10b981`)
- **Secondary Color**: Deep Royal Blue (`#0f4c81`)
- **Accent Color**: Rajasthan-inspired Vibrant Orange (`#f97316`)
- **Light Background**: Slate Light Gray (`#f8fafc`)
- **Dark Text**: Slate Slate 900 (`#0f172a`)
- **Transitions**: Smooth HSL cubic-bezier animations (`all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`).

### Premium Visual Accents Needed:
- **Glassmorphism**: Backdrop blur cards (`backdrop-filter: blur(10px)`) with thin borders.
- **Tech Shimmer**: Shimmer sweep animation (`@keyframes shimmerMotion`) gliding across grid cards.
- **Radar Pulse**: Glowing concentric circle indicators (`@keyframes radarPulse`) for live geo-location tracking.
- **Horizontal Infinite Marquee**: Dynamic ticking scrolling track (`@keyframes tickerLoop`) for real-time dispatch streams.

---

## 2. Architecture & State-Based Routing

The Home Page must employ **React State-Based page routing** instead of static scroll overlays:
- Maintain a central state: `const [activePage, setActivePage] = useState('Home');`
- Clicking any menu item, footer redirect, or Quick Access link must update this state to render only the corresponding component stack with zero layout stacking or latency.

---

## 3. Header & Optional Top Bar

### Dark Header Top Bar:
- Left: "Rajasthan Urban Civic Service Platform" and "Nagar Nigam • Nagar Parishad • Nagar Palika".
- Right: Toll-free support (`1800-180-6127`) and an animated "Emergency Civic Issue" alarm tag.

### Main Navbar:
- **Logo**: "RajCivic Connect" with a shield icon.
- **Nav Links**: Home, Complaint, Track Complaint, Dashboards, Reports, Profile.
- **CTAs**: "Report Complaint" button, "Login/Register" button.
- **Style**: Sticky top navigation, white transparent background, collapsible mobile drawer, active tab highlight.

---

## 4. Live Dispatch Ticker & Hero Section

### A. Live Dispatch Marquee Ticker:
- Positioned right above the hero body.
- Displays a continuous, infinitely scrolling marquee of mock municipal resolutions:
  * *Jaipur NNG: Sewer line clearance at Mansarovar — RESOLVED (SLA: 4.5h)*
  * *Jodhpur NNJ: Pipeline pressure leakage in Shastri Nagar — WORK STARTED*
  * *Kota NN: Streetlight bracket replacement — COMPLETED*
  * *Udaipur NP: Waste dump at Ward 8 — ASSIGNED*

### B. Hero Body:
- **Background**: Custom Rajasthan smart city vector illustration overlaid with a radial gradient mask (`radial-gradient(circle at 10% 20%, rgba(248, 250, 252, 0.82) 0%, rgba(236, 253, 245, 0.78) 100%)`).
- **Main Heading**: "Smart Rajasthan Civic Complaint Management Platform".
- **Subheading**: "RajCivic Connect is a digital civic service platform for Nagar Nigam, Nagar Parishad, Nagar Palika, wards, departments, officers, workers and citizens to report, track, assign, verify and resolve public complaints."
- **CTA Buttons**: Report Complaint, Track Complaint, Login/Register.
- **Platform Highlights**: Geo-tagged, photo/video evidence, SLA-based, officer verification, escalations.
- **Right Column Visual**: A premium dashboard preview card tracing an **Active Case File**:
  - Complaint ID: `RJCIVIC-JOD-NNJ-2026-0001`
  - Category: `Sewer Overflow`
  - Priority: `High`
  - Status: `Worker Assigned` *(60% progress visual)*
  - SLA: `6 Hours` remaining
  - Department: `Drainage Department`
  - Ward: `Ward 12`
  - Includes a glowing **radar pulse signal indicator** for live worker tracking.

---

## 5. Core Platform Features Grid ("Why RajCivic Connect?")

Paragraph: "RajCivic Connect helps citizens report civic issues online and helps urban local bodies manage complaints with real-time tracking, worker assignment, officer verification, SLA monitoring and escalation system."

Implement a **3x3 grid** of cards containing bold decorative numeric watermarks (`01` through `09`) in the background:
1. **Geo-tagged complaint**: captured using map/location support.
2. **Photo/video upload**: citizen uploads proof of issue.
3. **ULB/ward auto routing**: routes to correct Nagar Nigam, Parishad, or Palika.
4. **Department auto assignment**: category maps to correct department.
5. **SLA timer**: fixed resolution deadline.
6. **Worker assignment**: officer assigns ground-level field worker.
7. **Officer verification**: checks before/after proof before closing.
8. **Citizen feedback**: citizen rating and satisfaction closure.
9. **Escalation system**: delayed complaints escalate automatically to commissioners.

---

## 6. Popular Complaint Categories Catalog

Display **8 responsive cards** with clean vector icons, localized descriptions, and report anchors:
1. **Garbage**: Garbage not collected, illegal dumping, dustbins.
2. **Street Light**: Not working, damaged poles, dark areas.
3. **Road / Pothole**: Potholes, broken roads, dividing issues.
4. **Water Leakage**: Water leaks, dirty water, pipeline cracks.
5. **Drainage / Sewer**: Sewer blockages, sewer overflow, open manholes.
6. **Public Toilet**: Dirty toilets, broken doors, water shortage.
7. **Animal Issue**: Stray animals, dead animal pickup.
8. **Public Property**: Damaged parks, broken benches, assets.

---

## 7. 7-Stage Complaint Tracking Timeline

Add an input field for Complaint IDs (placeholder: `RJCIVIC-JOD-NNJ-2026-0001`) that, upon submission, triggers a **7-stage status progress timeline**:
1. **Submitted**: Complaint registered by citizen and auto-routed to ULB.
2. **Under Review**: Nodal Officer reviewed geographic tags & photos.
3. **Assigned**: Routed to Jodhpur Nagar Nigam (North) Sanitary Dept.
4. **Work Started**: Field worker राजेश कुमार arrived at site and started excavations.
5. **Officer Verification** *(Active State)*: Before/after work proofs uploaded. Awaiting officer confirmation.
6. **Resolved**: Pending citizen ratings.
7. **Citizen Feedback**: Rating validation and satisfaction record lock.

---

## 8. Operational Workflow Timeline ("How It Works")

Display a connected **5-step card diagram**:
- **Step 1: Citizen Reports Complaint** (category, photos, location).
- **Step 2: System Routes Complaint** (maps district, ULB, department).
- **Step 3: Officer Assigns Worker** (reviews and allocates ground repairer).
- **Step 4: Worker Resolves Issue** (visits, resolves, uploads before/after proofs).
- **Step 5: Officer Verifies & Feedback** (officer confirms, citizen gives star rating).

---

## 9. Rajasthan-Level Structure Section

Display the **7-Tier Governance administrative hierarchy** (Level 1 Citizen up to Level 7 State Admin) alongside **3 municipal Urban Local Body descriptors**:
- **Nagar Nigam**: metropolitan corporations (>5 Lakh population).
- **Nagar Parishad**: municipal councils (>1 Lakh and <5 Lakh population).
- **Nagar Palika**: municipal boards/transitional towns.

---

## 10. Live Civic Dashboard & GIS Heatmap

### Six Live Metric Cards:
- Total Complaints (`1,42,853`)
- Pending Complaints (`3,842`)
- Resolved Complaints (`1,38,204`)
- SLA Delayed (`627 Cases`)
- Escalated Cases (`180 Cases`)
- Reopened Complaints (`112 Cases`)

### GIS Heatmap & Performance:
- Left: **GIS Issues Heatmap placeholder** (dark tech layout, glowing city pulse nodes, alert metrics).
- Right: **ULB resolution rate rankings** (Jaipur, Jodhpur, Kota progress bars) and Citizen Satisfaction aggregates (`4.82 / 5`).
- Includes a **Live Operations Response Stopwatch simulator** widget updating average dispatch intervals every second.

---

## 11. Trust & Transparency Indicators

Show **8 verification trust blocks**:
- Complaint ID tracking
- Photo/video evidence
- Worker before/after proof
- Officer verification
- Citizen feedback
- SLA deadline
- Escalation to higher authority
- Reports and analytics

---

## 12. Quick Access Action Hub

Display **6 shortcuts** linked directly to active page states:
- Report New Complaint
- Track Existing Complaint
- View Public Dashboard
- Login as Citizen
- Login as Worker
- Login as Officer/Admin

---

## 13. Footer Section

Multi-column GovTech footer:
- **Brand info**: RajCivic Connect short description and social anchors.
- **Sitemap Links**: Home, Complaint, Track Complaint, Dashboards, Reports, Login/Register, Profile.
- **Municipal Catalog Categories**: Garbage, Street Light, Road, Water, Sewer, Toilet, Animal, Property.
- **Nodal Support details**: Toll-free helpdesk (`1800-180-6127`), official support email, and Department of Local Self Government nodal office address in Jaipur.
- **Policy anchors**: Contact, Privacy Policy, Terms & Conditions.
