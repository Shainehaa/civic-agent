# Civic Agent 🚧🏙️

An AI-powered civic issue reporting platform that enables citizens to identify, report, validate, track, and resolve community problems through intelligent automation and community collaboration.

Built for the **Vibe to Ship Hackathon (Coding Ninjas × Google for Developers)** under the problem statement:

> **"Build a platform that enables citizens to identify, report, validate, track, and resolve community issues through collaboration, data, and intelligent automation."**

---

## 🌟 Overview

Civic Agent transforms a simple photograph into an actionable civic complaint.

Users can upload images of community issues such as potholes, garbage dumps, broken streetlights, damaged roads, or unsafe infrastructure. AI automatically analyzes the image, determines urgency, generates a structured report, assigns responsibility, and tracks the issue publicly until resolution.

The goal is to reduce friction in civic reporting while increasing transparency and accountability.

---

## ✨ Features

### 📸 AI-Powered Issue Reporting

Upload a single photo of a civic issue and let AI handle the analysis.

The system automatically detects:

* Issue type
* Severity level
* Danger score
* Description of the issue
* Responsible department

Supported examples include:

* Potholes
* Garbage dumps
* Broken streetlights
* Damaged roads
* Unsafe public infrastructure
* Water leakages
* Public hazards

---

### 🤖 Intelligent Image Analysis

Using **Gemini 2.5 Flash via Vertex AI**, Civic Agent generates:

* **Issue Type**
* **Severity Classification**

  * Low
  * Medium
  * High
  * Critical
* **Danger Score (0–10)**
* **AI-generated Description**
* **Suggested Responsible Department**

---

### 📍 Automatic Location Tracking

Every report is stored with:

* GPS coordinates
* Timestamp
* Reporter information (optional)
* AI metadata

This allows issues to be visualized geographically and monitored over time.

---

### ⏱️ Dynamic SLA Tracking

Each issue receives an automatically computed SLA deadline based on severity.

Example:

| Severity | SLA      |
| -------- | -------- |
| Low      | 14 Days  |
| Medium   | 7 Days   |
| High     | 3 Days   |
| Critical | 24 Hours |

Issues that exceed their SLA are automatically flagged as **Overdue** on the dashboard without requiring cron jobs or background workers.

---

### 🗺️ Public Issue Dashboard

The community dashboard provides:

* Issue cards with filters
* Open / In Progress / Resolved statuses
* Severity indicators
* Search functionality
* Interactive map view

Built using **Leaflet** and **OpenStreetMap**.

---

### 🔄 Transparent Status Updates

Anyone can update issue status:

```
Open → In Progress → Resolved
```

Every change is recorded in an immutable audit trail, including:

* Timestamp
* Previous status
* New status
* Update source (manual or AI)

This creates transparency and accountability throughout the resolution process.

---

### ✅ AI Resolution Verification

When authorities or community members claim an issue is fixed, they can upload an **"after" image**.

Gemini compares:

* Original issue image
* Resolution image

The system then generates:

* Resolution confidence score
* Verification summary
* Suggested status update

This prevents false resolution claims and improves trust in the platform.

---

## 🛠️ Tech Stack

| Category     | Technology         |
| ------------ | ------------------ |
| Frontend     | Next.js 16         |
| Language     | TypeScript         |
| Styling      | Tailwind CSS       |
| Database     | Firebase Firestore |
| AI Model     | Gemini 2.5 Flash   |
| AI Platform  | Google Vertex AI   |
| Maps         | Leaflet            |
| Map Provider | OpenStreetMap      |
| Deployment   | Google Cloud Run   |

---

## 🏗️ Architecture

```text
Citizen uploads image
          ↓
Gemini Vision Analysis
          ↓
Issue classification + severity scoring
          ↓
Firestore storage with GPS metadata
          ↓
Public dashboard and live map update
          ↓
Community tracking and status updates
          ↓
Resolution image upload
          ↓
Gemini verification and confidence scoring
```

---

## 📂 Project Structure

```text
app/
│
├── app/              # Next.js pages and API routes
├── components/       # Reusable UI components
├── lib/              # Firebase and Vertex AI utilities
├── services/         # Firestore operations and business logic
├── types/            # Shared TypeScript types
└── public/           # Static assets
```

---

## 🔐 Why Vertex AI Instead of the Gemini Developer API?

The project initially used the Gemini Developer API with API key authentication.

However, during development we encountered a documented authentication issue affecting newly issued **Auth Keys (AQ-prefixed keys)** introduced by Google AI Studio in mid-2026.

Rather than relying on API key authentication for production infrastructure, Civic Agent was migrated to **Vertex AI**, which offers:

* Service account authentication
* Better production readiness
* Improved security practices
* Simplified deployment on Google Cloud
* No dependency on API keys

This migration also completely avoided the authentication issue.

---

## 💻 Local Development

Clone the repository:

```bash
git clone <repository-url>
cd civic-agent
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

For complete setup instructions including:

* Firebase configuration
* Google Cloud authentication
* Environment variables
* Local testing procedures

please refer to:

```text
SETUP.md
```

---

## 🎯 Future Improvements

* User authentication and reputation scoring
* Duplicate report detection
* Government portal integration
* Department-wise analytics dashboards
* Predictive maintenance insights
* Multi-language support
* Push notifications
* Crowdsourced issue validation

---

## 🤝 Contributing

Contributions, suggestions, and feedback are always welcome.

Feel free to open issues or submit pull requests to improve Civic Agent.

---

## 📜 License

This project is licensed under the MIT License.

---

## 🙌 Credits

Built with:

* Next.js
* Firebase Firestore
* Google Vertex AI
* Gemini 2.5 Flash
* Leaflet
* OpenStreetMap
* Tailwind CSS

Special thanks to the **Vibe to Ship Hackathon**, **Coding Ninjas**, and **Google for Developers** for providing the opportunity and challenge that inspired this project.
