# Edge-Health Sync

Edge-Health Sync is a patient-record and care coordination platform with a React frontend, a Node.js backend, and a Python AI service. The app supports patient management, vitals collection, QR-based workflows, and Supabase-backed record syncing.

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+

## Frontend setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a frontend environment file and add the required values:
   ```bash
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_BACKEND_URL=http://localhost:3001
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Backend setup

1. Change into the backend directory:
   ```bash
   cd edge-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```

## Supabase clinic RBAC setup

Apply the migrations in `supabase/migrations`, especially `20260913000000_create_clinic_rbac_profiles.sql`, before registering users. It creates the `public.users` profile used by RBAC and installs the Auth signup trigger. If the migration is not applied, Supabase Auth can return `500 - Database error saving new user` while creating an account.

With the Supabase CLI installed and linked to the project, run:

```bash
supabase db push
```

## AI service setup

1. Change into the AI service directory:
   ```bash
   cd edge-backend/ai-service
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the service:
   ```bash
   python app.py
   ```

## Architecture overview

- Frontend: React + Vite + Tailwind CSS for the patient dashboard and record views.
- Backend: Node.js/Express API for authentication, record management, and integration endpoints.
- AI service: Python service for diagnosis workflows and cryptographic signing helpers.
- Data layer: Supabase stores structured patient vitals and records, while the app also supports offline sync through Dexie.
