# 🚀 ResuMatch AI - Next-Gen Resume Intelligence & Career Guidance Platform

A full-stack, production-ready AI Resume Intelligence and Career Guidance web application featuring 30+ career tools including ATS optimization, AI Job Tracker CRM, Mock Interview Voice Mode, LinkedIn/GitHub analyzers, Salary Insights, and Regional Language (Telugu) guidance.

---

## 📦 Quick Start & Run Commands

### 1. Local Development (Fastest)

#### Prerequisites
- Python 3.10+ installed

#### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 2: Start the Server
**Option A: Standard Flask Server**
```bash
python app.py
```

**Option B: Production WSGI Server (Windows / Linux)**
```bash
python wsgi.py
```

#### Step 3: Open in Browser
Navigate to: **`http://127.0.0.1:5000`**

---

### 2. Docker Deployment

#### Build the Docker Image:
```bash
docker build -t resumatch-ai .
```

#### Run the Container:
```bash
docker run -p 5000:5000 resumatch-ai
```

---

### 3. Cloud One-Click Deployments

#### 🟣 Render
1. Create a new **Web Service** on [render.com](https://render.com).
2. Connect your Git repository.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `gunicorn --bind 0.0.0.0:$PORT app:app`

#### 🚂 Railway
1. Push to GitHub and connect repository to [railway.app](https://railway.app).
2. Railway automatically detects `Procfile` / `Dockerfile` and deploys.

#### 🟪 Heroku
```bash
heroku create resumatch-ai
git push heroku main
```

---

## ⚙️ Environment Variables (Optional)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port number to bind the web server |
| `HOST` | `0.0.0.0` | Host IP address |
| `OPENAI_API_KEY` | *(None)* | *(Optional)* If provided, delegates Chatbot queries to OpenAI GPT models. If omitted, uses the built-in AI reasoning engine. |

---

## 🌟 Key Features Included

- 📊 **Resume Intelligence Dashboard**: Real-time scorecards, skill taxonomy, experience timeline, and radar charts.
- 🤖 **Universal AI Chatbot**: Context-aware career assistant answering technical, resume, interview, and salary questions.
- 📋 **AI Job Tracker CRM**: Kanban board (Applied, Interviewing, Offer, Rejected) with follow-up alerts.
- 🎙️ **Mock Interview Voice Mode**: AI speaks questions aloud; analyzes candidate microphone answers for clarity and filler words (*umm, like, aa*).
- 🔗 **Resume-to-LinkedIn Optimizer**: Generates catchy headlines, About section, and detects profile mismatches.
- 💻 **GitHub & Portfolio Quality Auditor**: Evaluates code repo quality, missing sections, and job fit.
- 💰 **Salary Insights & High-ROI Skills**: Market salary ranges and skills unlocking +$15k–$30k raises.
- 🛡️ **Job Scam / Risk Filter**: Flags Telegram interview traps, upfront payment schemes, and suspicious postings.
- 📄 **1-Click Resume Templates**: 6 switchable designs (Fresher, Experienced, Minimal ATS, Developer, Data Analyst) with print/PDF export.
- 🇮🇳 **Regional Telugu Support**: Telugu (తెలుగు) audio/text guidance and metric breakdowns.
- 🎯 **Career Goal Timeline Planner**: Milestone roadmaps for 3, 6, or 12-month career transitions.
- 🤝 **Networking Assistant**: Cold InMail, referral requests, HR follow-ups, and offer negotiation templates.
