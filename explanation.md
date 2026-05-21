**Overview**

- **Purpose:** A Vite + React web application for RailLMS (learning/management system) with role-based dashboards and Supabase-backed auth and data.
- **Audience:** Super Admins, Admins, and Users (learners/staff). The app provides separate dashboards and permissions per role.

**Key Features**

- **Role-based Dashboards:** Three distinct dashboards (Super Admin, Admin, User) with different UI and permissions.
- **Authentication & Authorization:** Uses Supabase for authentication and database; login detects role and routes to the appropriate dashboard.
- **Admin Management:** Super Admin can create Admin accounts (Super Admin supplies credentials for new admins).
- **User Management:** Admins can create Users; usernames are used (not email) per project notes.
- **Routing & Access Control:** Routes use role checks so pages are only accessible by allowed roles.
- **Responsive UI:** Built with React, Tailwind, and shadcn/ui components for a responsive modern interface.

**Who Uses What (Roles & Responsibilities)**

- **Super Admin:** Full access. Can create Admins and manage high-level settings. Fixed super admin credentials are kept in project notes.
- **Admin:** Can create and manage Users, view admin-specific dashboards and pages.
- **User:** Uses learning/management features available to end-users; limited access compared to Admin and Super Admin.

**Typical User Flows**

- **Super Admin initial login:** Use the fixed credentials (see [text.txt](text.txt#L39)). After login, create Admin accounts — Super Admin generates username/password for Admins.
- **Admin onboarding:** Super Admin shares generated credentials. Admin logs in and can create Users (usernames used instead of email).
- **User login:** Users log in with credentials created by Admins and see only their permitted pages and dashboards.

**Where To Look In The Code**

- **Pages / Routes:** [src/pages/Login.tsx](src/pages/Login.tsx), [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx), [src/pages/Index.tsx](src/pages/Index.tsx), [src/pages/NotFound.tsx](src/pages/NotFound.tsx).
- **Role-specific subpages:** [src/pages/dashboard](src/pages/dashboard)
- **UI components:** [src/components/ui](src/components/ui) contains shared UI primitives used across dashboards.
- **Hooks & utils:** [src/hooks](src/hooks) for auth and helpers; [src/lib/utils.ts](src/lib/utils.ts) for utility functions.
- **Supabase configuration & migrations:** `supabase/config.toml` and `supabase/migrations` directory contain DB migration SQL and config.
- **Project notes & credentials:** [text.txt](text.txt#L1-L999) includes quicknotes and credentials kept by the team.

**Tech Stack & Integrations**

- **Frontend:** Vite + React + TypeScript.
- **Styling/UI:** Tailwind CSS and shadcn UI primitives.
- **State / Data fetching:** `@tanstack/react-query` (React Query) used for server state.
- **Auth & Database:** Supabase (Postgres + Auth) — server-side data stored in migrations under `supabase/migrations`.

**How To Run Locally**

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview production build locally:

```bash
npm run preview
```

Configuration notes: set Supabase environment variables (URL and ANON key) in your environment or via your chosen secret manager before running features that require backend access.

**Deployment (Web)**

- The app builds to a static site via `npm run build`. Deploy the compiled `dist` output to any static host (Netlify, Vercel, Cloudflare Pages, S3+CloudFront) or to a server that serves static files.
- The existing repo has already been deployed as a website — the same build output is what will be packaged for mobile (see below).

**Packaging As Mobile Apps (Android / iOS)**

- Two main options:
  - **Capacitor (recommended):** Wrap the Vite build output into native Android and iOS projects. Steps summary:
    1. `npm run build`
    2. Install Capacitor: `npm install @capacitor/core @capacitor/cli`
    3. Initialize Capacitor and point `webDir` to the Vite output (`dist`).
    4. Add platforms: `npx cap add android` and `npx cap add ios`.
    5. Open in Android Studio / Xcode, build/sign, and publish.
  - **Progressive Web App (PWA):** Add a service worker and web manifest so users can install the web app to home screen. Simpler, but not a native store binary.

- Platform requirements: Android builds can be done on Windows with Android Studio; iOS builds require a Mac with Xcode and an Apple Developer account to publish.

**Security & Credentials**

- Do not commit production Supabase secrets to the repo. Use environment variables or secret stores.
- Project notes in `text.txt` contain demo credentials and should be treated carefully; rotate production passwords.

**Next Steps / Suggestions for New Contributor**

- Start by running `npm run dev` and sign in as Super Admin (see [text.txt](text.txt#L39)) to explore flows.
- Inspect `src/hooks/useAuth.tsx` and the routing logic to understand role detection and protected routes.
- Review Supabase migration SQL in `supabase/migrations` to understand the schema and any custom RPCs.
- If you want mobile apps, I can scaffold Capacitor integration and add a basic PWA manifest for installability.

**Useful Files**

- [package.json](package.json) — scripts and dependencies.
- [vite.config.ts](vite.config.ts) — Vite config and build settings.
- [src/pages/Login.tsx](src/pages/Login.tsx) and [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) — entry points for auth and dashboards.
- [supabase/migrations](supabase/migrations) — DB schema and migrations.
- [text.txt](text.txt) — internal notes and demo credentials.

If you'd like, I can now:

- Scaffold Capacitor for Android/iOS and commit the configuration.
- Add a PWA manifest and service worker for installability.
- Generate a short developer checklist for onboarding.

Tell me which of the above you'd like me to do next.
