Civic Agent

An AI-powered platform that lets citizens report community issues — potholes, garbage dumps, broken infrastructure — with a single photo. Gemini analyzes the image, determines severity and danger level, writes a structured report, and the issue is tracked publicly until it's resolved.

Built for the Vibe to Ship hackathon (Coding Ninjas × Google for Developers), addressing the problem statement: "Build a platform that enables citizens to identify, report, validate, track, and resolve community issues through collaboration, data, and intelligent automation."

What it does


Upload a photo of a civic issue (pothole, garbage, broken streetlight, etc.)
Gemini (via Vertex AI) analyzes the image and returns: issue type, severity (Low/Medium/High/Critical), a danger score out of 10, a written description, and the responsible department
The issue is saved with GPS location and an automatically computed SLA deadline based on severity — issues that exceed their deadline are flagged as overdue on the public dashboard, without needing any background job
Community dashboard lists all reported issues with status filters and a live map (OpenStreetMap/Leaflet)
Anyone can manually update status (Open → In Progress → Resolved), and every change — manual or AI-driven — is logged in a visible status history / audit trail for transparency
Resolution verification: upload an "after" photo, and Gemini compares it against the original to produce a resolution confidence score and updates the issue's status accordingly


Tech stack


Next.js 16 (App Router) + TypeScript + Tailwind CSS
Firebase Firestore for data storage (images stored as compressed base64, no Storage bucket needed)
Gemini 2.5 Flash via Vertex AI for image analysis and resolution verification, authenticated via Google Cloud Application Default Credentials (no API key)
Leaflet / OpenStreetMap for the map view
Deployed on Google Cloud Run


Why Vertex AI instead of the Gemini Developer API

This project originally used a Gemini Developer API key, but hit a documented, account-level authentication bug affecting newly issued "Auth keys" (AQ. prefix keys, the new default issued by Google AI Studio as of mid-2026). Rather than wait on a third-party fix, the project was migrated to Vertex AI, which authenticates through GCP service accounts instead of API keys entirely — a more production-appropriate pattern for a real deployment, and one that sidesteps the bug completely.

Local development

See SETUP.md for full setup instructions, including environment variables and local testing steps.

Project structure

app/              Next.js pages and API routes
components/       Reusable UI components (upload form, issue cards, map, navbar)
lib/              Firebase client, Gemini/Vertex AI integration, image compression
services/         Firestore read/write logic, including SLA and status history logic
types/            Shared TypeScript types

Credits

Built using Next.js, Firebase, Google Vertex AI / Gemini, Leaflet, and OpenStreetMap. All third-party libraries are listed in package.json.
