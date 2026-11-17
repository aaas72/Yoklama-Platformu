# Yoklama — Smart Attendance Platform

A multi-school attendance system that takes roll call with face recognition. A teacher points a camera at the class, and the platform identifies each student and records attendance automatically — no paper lists, no manual calling of names.

![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=flat-square&logo=opencv&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)

## Features

- **Face-recognition roll call** — capture frames from the browser camera; the API detects every face, matches it against enrolled students and marks them present
- **Reliable decisions** — distance thresholds, a confidence margin between the top candidates, a face-quality check and a sliding-window consensus across several frames keep false matches out
- **Self-improving profiles** — high-confidence matches refine each student's stored embedding over time
- **Multi-tenant** — each school registers separately and manages its own teachers, classes and students
- **Dashboard** — attendance statistics and charts, plus management of classes, teachers and students
- **Secure API** — JWT authentication, hashed passwords and centralized error handling; interactive docs at `/docs`

## How Recognition Works

```text
Camera frame (base64)
   │
   ▼
Face detection + quality check (OpenCV)
   │
   ▼
Embedding extraction (DeepFace / face_recognition)
   │
   ▼
Nearest enrolled student (cosine distance) ── margin check vs. runner-up
   │
   ▼
Sliding-window consensus (3 of the last 5 frames) ──▶ attendance record
```

## Project Structure

```text
Yoklama-Platformu/
├── client/                       # React 19 + Vite + Tailwind CSS
│   └── src/
│       ├── pages/                # Landing, Login, RegisterSchool, AttendanceScanner, Dashboard
│       ├── pages/dashboard/      # Overview, Classes, Students, Teachers (+ add forms)
│       ├── components/           # CameraModal, PrivateRoute, UI kit
│       └── services/             # API clients per resource
└── server/                       # FastAPI backend
    ├── main.py                   # App entry point and routers
    ├── routes/ controllers/      # auth, school, class, teacher, student, attendance
    ├── controllers/attendance/   # scan, decision engine, face cache, learning, stats
    ├── utils/face_utils.py       # Detection, embeddings, similarity
    └── config/                   # Database and security settings
```

## Getting Started

**Requirements:** Python 3.10+, Node.js 20+, MySQL 8

### 1. API

Database settings live in `server/config/database.py`; the database and tables are created automatically on first start, together with a default admin account.

```bash
pip install fastapi uvicorn mysql-connector-python python-jose passlib opencv-python numpy deepface face_recognition
uvicorn server.main:app --reload      # run from the repository root → http://localhost:8000/docs
```

### 2. Web client

```bash
cd client
npm install
npm run dev
```

## Privacy

No face images or embeddings are stored in this repository. Student faces are captured through the app at enrollment time and stay in your own deployment; for local testing, use your own photos or a public, licensed face dataset and keep it out of version control (`dataset/` is git-ignored).

## API Overview

| Prefix | Purpose |
|---|---|
| `/api/auth` | Login and token handling |
| `/api/school` | School registration and settings |
| `/api/classes` | Class management |
| `/api/teachers` | Teacher management |
| `/api/students` | Student enrollment, including face registration |
| `/api/attendance` | Face scan, attendance records and statistics |

## Author

**Abdellah Sheikh** — [abdellahsheikh.dev](https://abdellahsheikh.dev) · [LinkedIn](https://www.linkedin.com/in/abdellahsheikh)
