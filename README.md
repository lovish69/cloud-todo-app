# Automated CI/CD Pipeline for Cloud-Based Todo Application

## Evidence of Work Completed - Review-1

**Team Members:**
- Lovish Barber (2505112070037)
- Neha Mishra (2505112070029)
- Ansh Pandit (2505112070011)

**Guide:** Prof. Natwar Jha  
**Department of MCA/MScIT, Faculty of IT & Computer Science, PARUL University**

---

## What is Completed

| Component | Status | Evidence |
|-----------|--------|----------|
| Project Profile (2.1-2.10) | Done | Report document |
| Requirement Analysis (3.1-3.7) | Done | Report document |
| Frontend (HTML/CSS/JS) | Done | public/index.html |
| Backend (Node.js + Express) | Done | server.js |
| REST API (CRUD operations) | Done | 5 endpoints working |
| Unit Tests | Done | test/test.js (5 tests pass) |
| Dockerfile | Done | Dockerfile |
| CI/CD Pipeline Config | Done | .github/workflows/ci-cd.yml |

---

## How to Run

### Prerequisites
- Node.js v18+
- npm

### Steps
```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
http://localhost:3000

# 4. Run tests
npm test
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | Get all tasks |
| GET | /api/tasks/:id | Get single task |
| POST | /api/tasks | Create new task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| GET | /health | Health check |

---

## Technology Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: Amazon DynamoDB (planned)
- Containerisation: Docker
- CI/CD: GitHub Actions
- Cloud: AWS EC2, CodeDeploy, CloudWatch
- Notifications: Telegram Bot
