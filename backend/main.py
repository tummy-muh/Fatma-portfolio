"""
Fatma Muhsin Portfolio — FastAPI backend
Deploy on Render. Set these environment variables in Render dashboard:
  RESEND_API_KEY  — your Resend API key (required)
  MAIL_TO         — destination email   (default: fatma.muhsin2023@gmail.com)
  MAIL_FROM       — verified sender     (default: onboarding@resend.dev)
  ALLOWED_ORIGINS — comma-separated frontend origins
                    (default: https://fatma-portfolio-ten.vercel.app)
"""
import os
from datetime import datetime
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

app = FastAPI(title="Fatma Portfolio API", version="2.2.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
# Parse allowed origins from env; fall back to the Vercel deployment URL.
_DEFAULT_ORIGINS = "https://fatma-portfolio-ten.vercel.app"
origins_env = os.getenv("ALLOWED_ORIGINS", _DEFAULT_ORIGINS)

if origins_env.strip() == "*":
    ALLOWED = ["*"]
else:
    ALLOWED = [o.strip().rstrip("/") for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED,
    allow_credentials=False,
    allow_methods=["*"],        # must be * (or include OPTIONS) for preflight
    allow_headers=["*"],        # must be * for preflight to pass
    max_age=600,
)


# ── Models ────────────────────────────────────────────────────────────────────
class ContactMessage(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    subject: str = Field(default="(No subject)", min_length=0, max_length=200)
    message: str = Field(min_length=1, max_length=4000)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "Fatma Portfolio API"}


@app.get("/api/health")
def health():
    return {"status": "healthy", "time": datetime.utcnow().isoformat()}


# ── Email via Resend ──────────────────────────────────────────────────────────
def send_via_resend(msg: ContactMessage) -> Optional[str]:
    """Returns None on success, error string on failure."""
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        return "skipped: RESEND_API_KEY not set"

    to_addr   = os.getenv("MAIL_TO",   "fatma.muhsin2023@gmail.com")
    from_addr = os.getenv("MAIL_FROM", "onboarding@resend.dev")

    html = f"""
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:auto;
                padding:28px;background:#FFF8FB;border-radius:16px;
                border:1px solid #E8B4C8">
      <h2 style="color:#7C2D5C;font-family:Georgia,serif;
                 border-bottom:2px solid #C9933A;padding-bottom:12px;margin-bottom:20px">
        📩 New Portfolio Message
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr>
          <td style="padding:8px 0;color:#6B5560;font-size:13px;width:100px"><strong>From</strong></td>
          <td style="padding:8px 0;font-size:15px">{msg.name} &lt;{msg.email}&gt;</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6B5560;font-size:13px"><strong>Subject</strong></td>
          <td style="padding:8px 0;font-size:15px">{msg.subject}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6B5560;font-size:13px"><strong>Received</strong></td>
          <td style="padding:8px 0;font-size:15px">
            {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')}
          </td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #E8B4C8;margin:20px 0"/>
      <p style="white-space:pre-wrap;line-height:1.75;font-size:15px;color:#1B0D17">
        {msg.message}
      </p>
      <hr style="border:none;border-top:1px solid #E8B4C8;margin:20px 0"/>
      <p style="font-size:12px;color:#6B5560;margin:0">
        Sent via <strong style="color:#7C2D5C">fatma-muhsin portfolio</strong> contact form.
        Reply directly to
        <a href="mailto:{msg.email}" style="color:#C9933A">{msg.email}</a>.
      </p>
    </div>
    """

    try:
        r = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from":     from_addr,
                "to":       [to_addr],
                "reply_to": msg.email,
                "subject":  f"[Portfolio] {msg.subject}",
                "html":     html,
            },
            timeout=15.0,
        )
        if r.status_code >= 400:
            return f"resend {r.status_code}: {r.text}"
        return None
    except Exception as exc:
        return f"exception: {exc}"


@app.post("/api/contact")
def contact(msg: ContactMessage):
    print(
        f"[CONTACT] {datetime.utcnow().isoformat()} "
        f"| {msg.name} <{msg.email}> | {msg.subject}"
    )
    err = send_via_resend(msg)
    if err and not err.startswith("skipped"):
        print(f"[CONTACT][EMAIL ERROR] {err}")
        raise HTTPException(
            status_code=502,
            detail="Email delivery failed — please try again or contact me directly.",
        )
    return {
        "ok": True,
        "message": "Thank you! Your message has been received. I'll be in touch within 24 hours.",
    }
