##🚀 Startup Validator – Full Stack Project
---
## 📌 Overview

**Startup Validator** is an AI-powered platform that helps entrepreneurs **validate and refine their startup ideas**.
It combines an **interactive AI agent**, **data-driven validation**, and **real-time chat** to guide founders in improving their **problem statements, solutions, target markets, teams, and business models**.

The system is built as a **full-stack application** with:

* ⚡ **Backend:** FastAPI (Python) – APIs, AI tools, and database logic
* 🌐 **Frontend:** React.js – Interactive user interface with real-time chat
* 🗄️ **Database:** PostgreSQL / MongoDB – Idea & user data storage
* 📚 **ChromaDB:** Vector database for chat memory
* 🔑 **Authentication:** Role-based access & session management
* 🔍 **LLM Integration:** OpenAI API for idea analysis and summarization

---

## ✨ Features

* 💡 **Idea Management:** Create, update, and refine startup ideas
* 🧠 **AI Chat Agent:** Context-aware assistant with memory (ChromaDB)
* 🔄 **Summarize Chat History:** Quickly revisit key points
* 🌍 **Market Info Gathering:** AI fetches & summarizes external insights
* 🔑 **Secure Authentication:** User login, roles, and protected routes
* 📄 **PDF Reporting:** Generate structured reports for ideas
* 🛠 **Multi-Environment Config:** Dev, Staging, and Production ready

---

## 📂 Project Structure

```
startup-validator/
│── backend/ (FastAPI)
│   ├── routes/               # API routes
│   ├── agents/               # AI agent logic
│   ├── models/               # Pydantic models
│   ├── config.py             # Environment config loader
│   └── main.py               # FastAPI entry point
│
│── frontend/ (React.js)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Pages (Home, Dashboard, Chat)
│   │   ├── services/         # API calls & WebSocket handlers
│   │   └── App.js            # Main React App
│   └── package.json
│
│── docs/                     # Documentation
│   ├── configuration.md      # Env & deployment setup
│   ├── api_reference.md      # API endpoints & examples
│   └── architecture.md       # Architecture diagrams
│
│── .env.development          # Local env variables
│── .env.staging              # Staging env variables
│── .env.production           # Production env variables
│── requirements.txt          # Python dependencies
│── README.md                 # Main project documentation
```

---

## ⚙️ Setup & Installation

### 🔧 Backend (FastAPI)

1. Navigate to backend:

   ```bash
   cd backend
   ```
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```
3. Setup `.env`:

   ```ini
   APP_ENV=development
   DATABASE_URL=postgresql://user:password@localhost:5432/startup_db
   OPENAI_API_KEY=sk-xxxx
   SECRET_KEY=super-secret-key
   DEBUG=true
   ```
4. Run server:

   ```bash
   uvicorn main:app --reload
   ```

   API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🎨 Frontend (React.js)

1. Navigate to frontend:

   ```bash
   cd frontend
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Setup `.env`:

   ```ini
   REACT_APP_API_BASE_URL=http://localhost:8000
   REACT_APP_WS_URL=ws://localhost:8000/ws
   ```
4. Run development server:

   ```bash
   npm start
   ```

   App runs at: [http://localhost:3000](http://localhost:3000)

---

## 📚 Documentation

* [Configuration Guide](./docs/configuration.md) – Environments & deployment
* [API Reference](./docs/api_reference.md) – Endpoints with examples
* [Architecture](./docs/architecture.md) – System & class diagrams

---

## 🚀 Deployment

### Staging

```bash
APP_ENV=staging uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### Production (Gunicorn + Uvicorn)

```bash
APP_ENV=production gunicorn -k uvicorn.workers.UvicornWorker backend.main:app
```

### Docker Compose

```yaml
version: "3.9"
services:
  backend:
    build: ./backend
    env_file: .env.production
    ports:
      - "8000:8000"
    depends_on:
      - db
  frontend:
    build: ./frontend
    env_file: .env.production
    ports:
      - "3000:3000"
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: startup_db
    ports:
      - "5432:5432"
```

---

## 📌 Milestones

* ✅ **Week-VI**: User login & role-based access
* ✅ **Week-VIII**: Idea update tools & PDF report generation
* ✅ **Week-IX**: Multi-env config & API docs update
* 🔄 **Next**: Full deployment & user testing

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/foo`)
3. Commit your changes (`git commit -m 'Add foo'`)
4. Push the branch (`git push origin feature/foo`)
5. Open a Pull Request

---

## 📄 License

Licensed under the **MIT License** – feel free to use and adapt.

---