# Riwi Learning Platform

Personalized learning platform that complements Riwi's educational process by generating customized improvement plans using AI.

---

## 🎯 Problem

Riwi teaches in 11 months what normally takes years. The intensive pace and uniform content from Moodle doesn't adapt to each coder's learning style, causing some to fall behind.

---

## 💡 Solution

Platform that takes:

1. Moodle performance data
2. Soft skills self-assessment
3. Manual topic selection

And uses AI to generate a personalized 4-week curriculum that integrates technical reinforcement with soft skills development.

## ✨ Key Features

- **AI Learning Path:** Automatic generation of a 4-week study plan based on individual gaps.
- **Soft Skills Integration:** Plans include emotional intelligence and communication tasks alongside technical code.
- **TL Analytics Dashboard:** Visual tracking for Team Leaders to identify "at-risk" coders before they fail.
- **Moodle Integration (Manual):** Current performance input to feed the AI engine.

---

## 🚀 Tech Stack

**Frontend:**

- HTML5, CSS3, JavaScript (Vanilla)
- Multi-Page Application (MPA)

**Backend:**

- Node.js + Express (Main API)
- Python + FastAPI (AI Microservice)

**Database:**

- PostgreSQL

**AI:**

- Google Gemini API

**Analysis:**

- Pandas + Matplotlib

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### Backend (Node.js)

```bash
cd backend-node
npm install
cp .env.example .env
# Edit .env with your config
npm run dev
```

### Backend (IA / Python)

```bash
cd backend-python
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Gemini API key
uvicorn app.main:app --reload
```

### Database

```bash
# Create database
createdb riwi_learning

# Run schema
psql -d riwi_learning -f database/schema.sql

# Load seed data (optional)
psql -d riwi_learning -f database/seeds/users.sql
```

### Fronted

```bash
cd frontend
# Use Live Server extension in VSCode or open index.html in browser
```

---

## 🌐 URLs (Local Development)

- Frontend: http://localhost:5500

- Node.js API: http://localhost:3000

- Python API: http://localhost:8000

---

## 📂 Project Structure

```bash
learning-platform/
├── backend-node/                # Main API Server (Express.js)
│   └── src/
│       ├── config/              # Database connection & session setup
│       ├── controllers/         # Business logic for all modules
│       ├── middlewares/         # Authentication guards & error handling
│       ├── models/              # Data schemas & Database interaction
│       ├── routes/              # API endpoint definitions
│       ├── utils/               # Helper functions & validation logic
│       └── server.js            # Node.js entry point
│
├── backend-python/              # AI & Data Science Microservice (FastAPI)
│   └── app/
│       ├── data/                # Static JSON content & datasets
│       ├── models/              # Pydantic models for request/response
│       ├── routers/             # AI and Analytics API endpoints
│       ├── services/            # Gemini IA integration & processing logic
│       ├── utils/               # Prompt builders & chart generators
│       └── main.py              # Python entry point
│
├── frontend/                    # Web Interface (MPA)
│   ├── assets/                  # Static assets
│   │   ├── css/                 # Global and role-specific styles
│   │   ├── js/                  # Frontend logic & API fetch calls
│   │   └── icons/image          # UI resources
│   └── views/                   # HTML Pages grouped by role
│       ├── auth/                # login.html, register.html
│       ├── coder/               # dashboard, onboarding, plan, status
│       └── tl/                  # analytics, coder-detail, dashboard
│
├── database/                    # SQL Infrastructure
│   └── schema.sql               # Main Database Schema (DDL)
│
├── docs/                        # Project Documentation
│   ├── diagrams/                # Architecture & ER diagrams
│   ├── scrum/                   # Sprint notes & methodology
│   └── wireframes/              # UI/UX design exports
│
├── .env.example                 # Template for environment variables
├── .gitignore                   # Files and folders ignored by Git
├── package.json                 # Node.js dependencies and scripts
└── README.md                    # Project documentation
```

---

## 👥 Team

- Héctor - Backend Lead + Documentation
- Miguel - Database Architect
- Duvan - Frontend (Coder views)
- Julio - Frontend (TL views) + UX/UI
- Camilo - QA + Python/AI
