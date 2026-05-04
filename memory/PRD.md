# All Best Fencing — PRD

## Problem Statement
Build an attractive, modern, SEO-friendly fencing website for "All Best Fencing" (+1 (604) 358-0406 · allbestfencing@gmail.com) serving Greater Vancouver. Must include WhatsApp + call floating buttons, a "Get My Quote" form that (a) emails allbestfencing@gmail.com and (b) logs to a Google Sheet — progressively (as soon as email OR phone is entered) without waiting for a full form submission.

## Core Requirements
- Marketing landing page, light mode, premium aesthetic inspired by logo's navy + orange wood palette
- Progressive lead capture (email or phone triggers backend notification)
- Email notification to allbestfencing@gmail.com via Resend
- Google Sheet row append per lead
- Floating WhatsApp (wa.me) + Call (tel:) buttons
- SEO: semantic HTML, meta tags, OG, JSON-LD LocalBusiness schema
- Service areas: 13 BC cities within 30 miles of Surrey

## Users
- Homeowners in Greater Vancouver looking for fencing installation
- Commercial / property managers
- Admin (owner) — receives notifications

## Architecture
- Backend: FastAPI + MongoDB + Resend + gspread (Google Sheets)
- Frontend: React 19 + Tailwind + Shadcn UI + framer-motion
- All API routes under `/api`
- Progressive capture: 900ms debounced POST /api/leads/partial (client dedupe + server dedupe by email/phone)
- Full submission upgrades the same lead to stage:"full"

## Implemented (as of 2026-05-04)
- Backend endpoints: `/api/health`, `/api/leads/partial`, `/api/leads/submit`, `/api/leads`
- MongoDB Lead model with dedupe by email + normalized phone
- Graceful no-op when Resend / Google Sheets aren't configured (logs and continues)
- Frontend: Header, Hero (with progressive-capture form), WhyChooseUs, Services tetris grid, ServiceAreaMarquee, Portfolio, Testimonials, QuoteSection (full form), FAQ, Footer, FloatingActions (WhatsApp + Call)
- Light mode premium theme with warm cream backgrounds + orange/wood accents
- SEO: title, description, keywords, OG/Twitter tags, JSON-LD LocalBusiness schema, canonical
- Logo: updated to user-provided webp asset
- 10/10 backend pytest passing; frontend progressive-capture verified end-to-end

## Backlog (P0 / P1 / P2)
### P0 — to make integrations real
- [ ] Set `RESEND_API_KEY` and verified sender domain in `/app/backend/.env`
- [ ] Provide Google Service Account JSON at `/app/backend/google_creds.json` and set `GOOGLE_SHEETS_ID`. Share the sheet with the service account's client_email (Editor access)

### P1
- [ ] MongoDB indexes on `email` and `phone_norm`
- [ ] Simple IP rate-limit on `/api/leads/partial`
- [ ] Admin CSV export endpoint (already have GET /api/leads — add CSV download page)
- [ ] Additional service-specific landing pages for SEO (Wood Fence Vancouver, etc.)
- [ ] Real customer photos on portfolio section

### P2
- [ ] Before/after gallery slider
- [ ] Live chat widget (Tidio/Crisp)
- [ ] Blog section for SEO content

## Integrations Status
- Resend: installed + code ready, `RESEND_API_KEY` blank (MOCKED/disabled — backend logs and continues)
- Google Sheets: gspread installed + code ready, creds file not present (MOCKED/disabled — backend logs and continues)
- Both integrations activate as soon as env vars / creds file are provided. No code changes needed.
