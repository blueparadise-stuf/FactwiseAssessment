# ArogyaDesk — Patient Care Management System

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-v8-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Mongoose-47A248?logo=mongodb)](https://www.mongodb.com/atlas)

A complete, institutional healthcare management system designed for patient admissions, daily vital monitoring, bedside clinical rounds, fever-free discharge workflows, and operational metrics.

---

## 🌟 Architecture & Design System

ArogyaDesk is crafted with a modern, clinical aesthetic:
- **Clean White Canvas**: High-legibility backgrounds (`bg-white` and `bg-slate-50`) to reduce cognitive strain.
- **Deep Navy-Blue Accents**: Confident, clinical hierarchy (`#0f172a`, `#1e3a8a`, `#1e40af`) for structural framing, navigation, and primary callouts.
- **Emerald Status Indicators**: Standardized clinical pills (`bg-emerald-50 text-emerald-700 border-emerald-200`) indicating normal vitals, clear recovery, and bed availability.
- **Configurable Clinical Safeguards**: Clear alerts for temperature spikes (≥ 38.0°C), duplicate check-ins, and multi-day fever-free discharge requirements.

---

## 🩺 Core Feature Set

### 1. Multi-Role Authentication & Access Control
- **Administrator**: Full clinical and operational oversight, bed allocation, patient admissions, user administration, and discharge confirmations.
- **Doctor**: Clinical rounds tracking, bedside observations, vital assessments, and discharge recommendations.
- **Nurse**: Patient temperature logging, vitals queue management, and flagged value corrections with audit trails.

### 2. Operational Capacity & Bed Management
- Total institutional capacity calibrated to **74 beds** (`BED-01` through `BED-74`).
- Real-time live occupancy counter, available bed tracking, and occupancy percentage visualizer.
- Strict room collision prevention (HTTP 409 conflict if an occupied bed is reassigned).
- Automatic bed release upon completed administrator discharge.

### 3. Patient Care & Medical Registry
- Unified admission form with validation: Full Name, Age, Gender, Room/Bed allocation, Emergency Contact, and Clinical Notes.
- Real-time search across patient name, ID, and assigned room.
- Filter by status: `Admitted`, `Discharge Recommended`, `Discharged`.
- Complete patient chart with historical vitals, doctor visits, and discharge events.

### 4. Daily Temperature Monitoring & Duplicate Prevention
- Daily temperature recordings in Celsius with physiological boundary checks (34.0°C - 43.0°C).
- Automatic fever flagging (threshold ≥ 38.0°C).
- **Duplicate Prevention**: Rejects duplicate primary daily readings for the same patient on the same calendar day.
- **Audited Corrections**: Adjustments preserve original values and capture the clinical justification.

### 5. Bedside Doctor Rounds & Assessments
- Daily clinical evaluations documenting patient status (`Improving`, `Stable`, `Deteriorating`, `Critical`), lung/vital checks, and care plan updates.
- Highlights uncompleted doctor rounds and cross-references whether nursing vitals were taken beforehand.

### 6. Discharge Lifecycle & Institutional Eligibility
- **Demonstration Clinical Rule**: 3 consecutive calendar days with normal temperature (< 38.0°C).
- **Two-Step Approval**:
  1. Doctor reviews clinical streak and submits formal discharge recommendation.
  2. Administrator verifies admission paperwork, confirms discharge, updates room availability, and records outcome (`Recovered`, `Transferred`, `Deceased`).

### 7. Analytical Reports & Mortality Benchmarking
- Aggregate admissions, active inpatient volume, total successful recoveries, and transfer tallies.
- Survival and Mortality rate calculation with explicit 15% institutional reference alert.
- Audit trail log recording chronological actions, user IDs, and timestamps.
- One-click CSV export of the clinical patient registry.

---

## 🔑 Demo Credentials (Development & Evaluation)

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@arogyadesk.in` | `Admin@123` | Full system access, patient admissions & discharge confirmation |
| **Doctor** | `doctor@arogyadesk.in` | `Doctor@123` | Patient evaluations, doctor rounds & discharge recommendations |
| **Nurse** | `nurse@arogyadesk.in` | `Nurse@123` | Temperature recording, queue monitoring & vitals audit corrections |

*(Clickable auto-fill buttons are provided directly on the Login page for 1-click test access).*

---

## ⚖️ Clinical Guidance Disclaimer

> [!IMPORTANT]
> **Demonstration Assumptions**: The 3 consecutive fever-free calendar days rule and the 15% mortality monitoring threshold are institutional simulation assumptions implemented strictly for software verification and workflows. They do not constitute approved clinical guidelines. In production healthcare deployments, criteria must always be configured in consultation with medical officers.

---

## 🚀 Local Installation & Running Guide

### Prerequisites
- Node.js v18+ (v20+ recommended)
- npm v9+
- Active MongoDB connection (or live MongoDB Atlas URI)

### Quick Start (3 Steps)

1. **Install Dependencies**
   ```bash
   # In workspace root:
   npm --prefix server install
   npm --prefix client install
   ```

2. **Configure Environment Variables**
   - In `server/.env`:
     ```env
     PORT=5000
     NODE_ENV=development
     MONGODB_URI=mongodb+srv://wizardo7699_db_user:bLfiL81FPe6SFm6g@cluster0.3ebzkfx.mongodb.net/arogyadesk?retryWrites=true&w=majority&appName=Cluster0
     USE_MEMORY_DB=false
     JWT_SECRET=arogyadesk_jwt_super_secret_production_key_32bytes_minimum
     COOKIE_SECRET=arogyadesk_cookie_super_secret_encryption_key_2026
     CLIENT_URL=http://localhost:5173
     ```
   - In `client/.env`:
     ```env
     VITE_API_URL=http://localhost:5000
     VITE_API_BASE_URL=http://localhost:5000/api/v1
     ```

3. **Seed Database and Start Applications**
   ```bash
   # Seed realistic demo patients, beds BED-01 to BED-74, and staff accounts:
   npm --prefix server run seed

   # Run backend API server (port 5000):
   npm --prefix server run dev

   # In a separate terminal, run frontend client (port 5173):
   npm --prefix client run dev
   ```

4. **Run Automated Test Suite**
   ```bash
   npm --prefix server run test
   ```

---

## 🌐 Production Deployment Guide

### A. Database (MongoDB Atlas)
1. In your MongoDB Atlas cluster, go to **Network Access** and ensure your IP (or `0.0.0.0/0` for cloud hosting) is whitelisted.
2. In **Database Access**, verify your database user has read/write privileges.
3. Connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.3ebzkfx.mongodb.net/arogyadesk?retryWrites=true&w=majority
   ```

### B. Backend Deployment on Render
1. Create a new **Web Service** on [Render.com](https://render.com).
2. Connect your GitHub repository.
3. Set configuration:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Set Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `USE_MEMORY_DB`: `false`
   - `JWT_SECRET`: `<Generate strong 32+ char secret>`
   - `COOKIE_SECRET`: `<Generate strong secret>`
   - `CLIENT_URL`: `https://your-arogyadesk.vercel.app` (your frontend domain)
5. Deploy service and copy your public URL: e.g. `https://arogyadesk-api.onrender.com`.

### C. Frontend Deployment on Vercel
1. In [Vercel.com](https://vercel.com), click **Add New** ➔ **Project** and import repository.
2. Set configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://arogyadesk-api.onrender.com` (your deployed Render backend)
   - **Target**: Production, Preview, Development
4. Deploy. The included `vercel.json` ensures all client-side routes rewrite to `/index.html`.

---

## 📂 Project Structure

```
├── client/                      # Frontend Application (React + Vite + Tailwind)
│   ├── public/                  # Static assets & icons
│   ├── src/
│   │   ├── components/          # Reusable UI components & layouts
│   │   ├── context/             # AuthContext, ToastContext
│   │   ├── pages/               # Dashboard, Patients, Temperatures, Doctor Rounds, Discharges, Reports
│   │   ├── services/            # Axios API client with automatic token injection
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Router with Role-Based Protected Routes
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vercel.json              # Vercel SPA rewrite rule
│
├── server/                      # Backend REST API (Node.js + Express + Mongoose)
│   ├── src/
│   │   ├── config/              # Database connection & env validation
│   │   ├── controllers/         # Request handling & HTTP responses
│   │   ├── middleware/          # JWT auth, role validation, error handler
│   │   ├── models/              # User, Patient, TemperatureRecord, DoctorVisit, FacilitySettings, AuditLog
│   │   ├── routes/              # Express API routers (v1)
│   │   ├── scripts/             # seed.ts database populator
│   │   ├── services/            # Core business & clinical eligibility logic
│   │   ├── tests/               # Vitest integration test suite
│   │   ├── utils/               # Timezone-aware date calculations
│   │   ├── validators/          # Zod validation schemas
│   │   ├── app.ts               # Express application setup with CORS & security
│   │   └── server.ts            # Entrypoint & listener
│   ├── package.json
│   ├── render.yaml              # Render deployment spec
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── .gitignore
├── package.json                 # Monorepo scripts
└── README.md
```

---

## 📄 License
ISC License. Built for healthcare operations and clinical assessments.
