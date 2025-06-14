# GitHub Mastery Learning Platform

This project is a full-stack application with a React frontend, Node.js/Express backend, and a Python script for survey satisfaction analysis. It supports local development and Docker-based deployment.

## Prerequisites

- **Node.js** (v16 or higher recommended)
- **npm** (v8 or higher)
- **Python** (3.12 recommended)
- **Docker** and **Docker Compose** (for containerized setup)
- **MongoDB** (local or cloud instance)

## Project Structure

- `client/` – React frontend
- `server/` – Node.js/Express backend
- `survey_check.py` – Python script for survey satisfaction
- `docker-compose.yml` – Multi-service orchestration
- `requirements.txt` – Python dependencies

---

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd BS-PM-2025-TEAM5-1
```

---

## 2. Install Dependencies

### Backend (server)

```bash
cd server
npm install
```

### Frontend (client)

```bash
cd ../client
npm install
```

### Python (for survey_check.py)

```bash
pip install -r requirements.txt
```

---

## 3. Environment Configuration

### Backend

Create a `.env` file in the `server/` directory (optional, for custom config):

```
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
PORT=5001
OPENAI_API_KEY=<your-openai-api-key>
```

### Frontend


## 4. Running the Project

### With Docker (Recommended)

From the project root:

```bash
docker-compose up --build
```

- Client: [http://localhost:3000](http://localhost:3000)
- Server: [http://localhost:5001](http://localhost:5001)

### Without Docker

#### Start Backend

```bash
cd server
npm run dev
```

#### Start Frontend

```bash
cd ../client
npm start
```

---

## 5. Running Tests

### Backend

```bash
cd server
npm test
```

### Frontend

```bash
cd client
npm test
```

---

## 6. Survey Satisfaction Script

To check survey satisfaction (Python):

```bash
python survey_check.py <google_sheets_xlsx_url>
```

Install dependencies first if you haven't:

```bash
pip install -r requirements.txt
```

---

## 7. Useful Commands

- **Build client for production:**  
  `cd client && npm run build`
- **Build server Docker image:**  
  `cd server && docker build -t github-mastery-server .`
- **Build client Docker image:**  
  `cd client && docker build -t github-mastery-client .`

---

## 8. CI/CD

See `JENKINS.md` for Jenkins pipeline and deployment instructions.

---

## 9. Troubleshooting

- Ensure MongoDB is running and accessible.
- For environment variables, see `.env.example` or the configuration section above.
- For Docker, ensure ports 3000 and 5001 are free.

--- 