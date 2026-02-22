# TimetableGen — AI-Powered Timetable Generator

> **NEP 2020 Aligned** | Full-Stack | Role-Based | Conflict-Free | Cloud-Ready

A complete production-grade web application for generating intelligent, conflict-free academic timetables using **Constraint Satisfaction + Local Search algorithms**, aligned with NEP 2020 credit system guidelines.

---

## Architecture Overview

```
timetable-generator/
├── backend/                    # Node.js + Express + MongoDB
│   ├── server.js               # App entry point
│   ├── app.yaml                # GCP App Engine config
│   ├── .env.example
│   └── src/
│       ├── config/
│       │   ├── db.js           # MongoDB connection
│       │   └── constants.js    # NEP 2020 constants, time slots, weights
│       ├── models/
│       │   ├── User.js         # Auth + role model
│       │   ├── Course.js       # Credits, type, lab flags
│       │   ├── Room.js         # Capacity, type (CLASSROOM/LAB/HALL)
│       │   ├── Faculty.js      # Workload, preferences, availability
│       │   └── Timetable.js    # Schedule entries, meta, status
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── timetableController.js
│       │   ├── courseController.js
│       │   ├── roomController.js
│       │   ├── facultyController.js
│       │   └── studentController.js
│       ├── routes/
│       │   ├── auth.js         # /api/auth
│       │   ├── timetable.js    # /api/timetables
│       │   ├── courses.js      # /api/courses
│       │   ├── rooms.js        # /api/rooms
│       │   ├── faculty.js      # /api/faculty
│       │   └── students.js     # /api/students
│       ├── middleware/
│       │   ├── auth.js         # JWT protect middleware
│       │   ├── roleCheck.js    # RBAC middleware
│       │   └── errorHandler.js # Global error handler
│       ├── services/
│       │   └── schedulerService.js  # Core CSP + Local Search algorithm
│       └── utils/
│           ├── logger.js       # Winston logger
│           └── seeder.js       # DB seed script
│
└── frontend/                   # React + Vite + TailwindCSS
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── app.yaml                # GCP config
    └── src/
        ├── main.jsx            # Entry point
        ├── App.jsx             # Router + protected routes
        ├── index.css           # TailwindCSS + custom classes
        ├── context/
        │   └── AuthContext.jsx # Global auth state
        ├── hooks/
        │   └── useAuth.js
        ├── services/
        │   └── api.js          # Axios + all API methods
        ├── utils/
        │   └── helpers.js      # Constants, formatters
        ├── components/
        │   └── common/
        │       ├── Layout.jsx
        │       ├── Navbar.jsx
        │       ├── Sidebar.jsx  # Role-based nav
        │       ├── ProtectedRoute.jsx
        │       └── LoadingSpinner.jsx
        └── pages/
            ├── auth/           Login, Register
            ├── admin/          Dashboard, TimetableGenerator, ManageCourses, ManageRooms, ManageFaculty, ManageUsers
            ├── faculty/        FacultyDashboard
            ├── student/        StudentDashboard
            ├── timetable/      TimetableView (shared)
            └── NotFound.jsx
```

---

## Core Features

| Feature | Description |
|---|---|
| **NEP 2020 Credits** | Theory/Practical/Tutorial split, credit-based scheduling |
| **CSP Algorithm** | Constraint Satisfaction with backtracking for conflict-free schedules |
| **Local Search** | Hill-climbing optimization for soft constraint scoring |
| **Hard Constraints** | No faculty/room/student double-booking, lab blocks, unavailability |
| **Soft Constraints** | Workload balance, morning theory/afternoon labs, session distribution |
| **Role-Based UI** | Admin, Faculty, Student dashboards with JWT auth |
| **Room Management** | CLASSROOM / LAB / SEMINAR_HALL / AUDITORIUM types |
| **Workload Balancing** | Auto-assigns faculty with lowest current load |
| **Admin Simulation** | Analyze feasibility before generation |
| **Publish Workflow** | DRAFT → GENERATING → GENERATED → PUBLISHED → ARCHIVED |
| **GCP Ready** | `app.yaml` for App Engine deployment |
| **Gemini AI Ready** | Modular design for Gemini API plugin |

---

## Running Locally

### Prerequisites
- **Node.js** >= 18
- **MongoDB** running locally or a MongoDB Atlas URI
- **npm** or **yarn**

### 1. Clone & Setup Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env: set MONGO_URI, JWT_SECRET

# Frontend
cd ../frontend
cp .env.example .env
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- Admin:   `admin@college.edu` / `Admin@1234`
- Faculty: `rajesh@college.edu` / `Faculty@1234`
- Student: `student@college.edu` / `Student@1234`
- 6 CSE Semester-5 courses
- 6 rooms (classrooms + labs)
- 3 faculty profiles

### 4. Start Backend

```bash
cd backend
npm run dev          # Development (nodemon)
# OR
npm start           # Production
```
Backend runs on: `http://localhost:5000`

### 5. Start Frontend

```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## API Reference

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |
| GET | `/api/auth/users` | Admin | List all users |
| PATCH | `/api/auth/users/:id/status` | Admin | Toggle user status |

### Timetables
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/timetables/generate` | Admin | Generate timetable |
| GET | `/api/timetables` | Private | List timetables |
| GET | `/api/timetables/:id` | Private | Get timetable with schedule |
| PATCH | `/api/timetables/:id/publish` | Admin | Publish timetable |
| PATCH | `/api/timetables/:id/archive` | Admin | Archive timetable |
| DELETE | `/api/timetables/:id` | Admin | Delete draft |
| GET | `/api/timetables/faculty-view` | Faculty | Faculty's own schedule |
| POST | `/api/timetables/simulate` | Admin | Feasibility analysis |

### Courses, Rooms, Faculty, Students
Standard CRUD at `/api/courses`, `/api/rooms`, `/api/faculty`, `/api/students`

---

## Scheduling Algorithm

**File:** `backend/src/services/schedulerService.js`

```
Phase 1: Sort courses (labs first, then by credits desc)
Phase 2: Greedy slot assignment
  - For each course session:
    - Find eligible faculty (qualified + workload + availability)
    - Find suitable room (type + capacity + free)
    - Score slot (morning theory +, afternoon lab +, spread +)
    - Commit if all hard constraints pass
Phase 3: Backtracking if unassigned
  - Try swapping lower-priority existing sessions
Phase 4: Local Search (Hill Climbing, 200 iterations max)
  - Swap entry pairs if soft-constraint score improves
Phase 5: Score & return
```

**Hard Constraints:**
- HC1: No faculty double-booking
- HC2: No room double-booking
- HC3: No student group double-booking
- HC4: Lab sessions in consecutive slots
- HC5: Faculty unavailability respected
- HC6: Room type must match session type

**Soft Constraints:**
- SC1: Workload balance across faculty
- SC2: Faculty day preferences
- SC3: Lecture spreading across days
- SC4: Max 3 consecutive hours
- SC5: Theory in morning, labs in afternoon

---

## Deployment (Google Cloud Platform)

### Backend (App Engine)

```bash
cd backend
cp .env.example .env.production   # Set MONGO_URI (Atlas), JWT_SECRET, etc.
gcloud app deploy app.yaml
```

### Frontend (App Engine / Cloud Storage)

```bash
cd frontend
npm run build                     # Creates dist/
gcloud app deploy app.yaml        # Or deploy dist/ to Cloud Storage + CDN
```

### MongoDB
Use **MongoDB Atlas** with a connection string in `MONGO_URI`.
The App Engine service account needs network access to Atlas cluster.

---

## ERP / AMS Integration

The REST API is designed for integration with any ERP/AMS system:

```bash
# Example: Fetch published timetable as JSON
curl -H "Authorization: Bearer <token>" \
  https://your-app.appspot.com/api/timetables?status=PUBLISHED&department=CSE&semester=5
```

---

## Gemini AI Integration (Future)

The `schedulerService.js` is modular. To integrate Gemini AI:

```js
// In schedulerService.js, replace or augment _scoreSlot() with:
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function geminiScoreSlot(course, session, day, slot, context) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = `Rate this slot 0-100 for: ${course.name} on ${day} at ${slot.label}. Context: ${JSON.stringify(context)}`;
  const result = await model.generateContent(prompt);
  return parseInt(result.response.text());
}
```

---

## Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Winston, Helmet, express-rate-limit

**Frontend:** React 18, Vite, TailwindCSS, React Query, React Router v6, React Hook Form, Axios, Lucide React, react-hot-toast

**Cloud:** Google Cloud Platform (App Engine Standard)

**Algorithm:** Custom CSP (Constraint Satisfaction Problem) + Hill-Climbing Local Search

---

## License

MIT © 2025 — TimetableGen
