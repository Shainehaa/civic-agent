# Civic Agent — Setup

## 1. Install dependencies
```
npm install
```

## 2. Create your .env.local file
Create a file called `.env.local` in the project root (same folder as `package.json`) with this content, filled in with YOUR real keys:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

GEMINI_API_KEY=your_gemini_api_key
```

All the `NEXT_PUBLIC_FIREBASE_*` values come from the `firebaseConfig` object you copied from Firebase Console → Project Settings → Your apps.

`GEMINI_API_KEY` is the key from Google AI Studio. Notice it does NOT have `NEXT_PUBLIC_` in front — that's intentional. It keeps this key secret on the server, never exposed to the browser.

## 3. Run it locally
```
npm run dev
```
Then open http://localhost:3000

## 4. Firestore security rules (test mode)
You started Firestore in "test mode," which is open to anyone for 30 days — fine for the hackathon, but remember it expires. If reads/writes suddenly start failing, check Firebase Console → Firestore → Rules.

## 5. What's already done
- Home page, Report flow, Dashboard (list + map), Issue detail + resolution verification
- Map uses Leaflet/OpenStreetMap — no API key, no billing needed
- Images are stored as base64 directly in Firestore — no Firebase Storage needed
- Gemini calls happen server-side only, via `/api/analyze-issue` and `/api/verify-resolution`

## 6. Still to do
- Plug in real keys (above)
- Test the full flow: upload → analyze → submit → see on dashboard/map → upload resolution photo → verify
- Deploy to Cloud Run (mandatory for hackathon submission — ask Claude for help with this step)
- Push to GitHub
- Write the Google Doc project description
