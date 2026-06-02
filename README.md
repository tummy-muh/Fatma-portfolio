# Fatma Muhsin — Portfolio

A modern, responsive portfolio website with a FastAPI backend for contact form email delivery via Resend.

## Project Structure

```
fatma-portfolio/
├── frontend/          # Static site (deploy on Vercel or Netlify)
│   ├── index.html
│   ├── css/styles.css
│   ├── js/main.js
│   ├── assets/        # Images
│   └── vercel.json
└── backend/           # FastAPI API (deploy on Render)
    ├── main.py
    ├── requirements.txt
    ├── render.yaml
    └── Procfile
```

## Deployment

### Backend (Render)

1. Push the `backend/` folder to a GitHub repo.
2. Create a new **Web Service** on [render.com](https://render.com), pointing to that repo.
3. Render auto-detects `render.yaml` — just set the secret env var:
   - **`RESEND_API_KEY`** → your key from [resend.com](https://resend.com) (Dashboard → API Keys)
4. Done. Your API will be live at `https://your-service.onrender.com`.

### Frontend (Vercel)

1. Push the `frontend/` folder to GitHub.
2. Import the repo in [vercel.com](https://vercel.com).
3. Before deploying, add an **Environment Variable** in Vercel:
   - `API_BASE` = `https://your-service.onrender.com`
   Then in `frontend/js/main.js`, line 2 becomes:
   ```js
   window.API_BASE = process.env.API_BASE || "https://your-service.onrender.com";
   ```
   Or simply hardcode the Render URL in `main.js` line 2.
4. Deploy.

### Resend Setup

1. Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day).
2. Go to **API Keys** → create a key → copy it to Render's `RESEND_API_KEY` env var.
3. Optionally verify your own domain for a custom `CONTACT_FROM` address.
   Until then, `onboarding@resend.dev` works as sender (Resend's default sandbox).

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
RESEND_API_KEY=your_key uvicorn main:app --reload

# Frontend — just open index.html in a browser, or:
cd frontend && python -m http.server 3000
```
