from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

import resend
import gspread
from google.oauth2.service_account import Credentials


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
LEAD_RECIPIENT_EMAIL = os.environ.get("LEAD_RECIPIENT_EMAIL", "allbestfencing@gmail.com")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Google Sheets
GOOGLE_SHEETS_ID = os.environ.get("GOOGLE_SHEETS_ID", "").strip()
GOOGLE_CREDENTIALS_PATH = os.environ.get("GOOGLE_CREDENTIALS_PATH", "").strip()

app = FastAPI(title="All Best Fencing API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ Models ============
class LeadPartial(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class LeadFull(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    service: Optional[str] = None
    city: Optional[str] = None
    project_details: Optional[str] = None


class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    service: Optional[str] = None
    city: Optional[str] = None
    project_details: Optional[str] = None
    source: str = "quote_form"
    stage: str = "partial"  # partial | full
    notified: bool = False
    sheet_logged: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ Helpers ============
def _normalize_phone(phone: Optional[str]) -> str:
    if not phone:
        return ""
    return "".join(ch for ch in phone if ch.isdigit())


def _build_email_html(lead: dict) -> str:
    rows = ""
    labels = {
        "name": "Name",
        "phone": "Phone",
        "email": "Email",
        "service": "Service Interested",
        "city": "City",
        "project_details": "Project Details",
        "stage": "Form Stage",
        "created_at": "Submitted At",
    }
    for key, label in labels.items():
        val = lead.get(key) or "—"
        rows += (
            f'<tr>'
            f'<td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#64748b;font-weight:600;width:170px;">{label}</td>'
            f'<td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#0f172a;">{val}</td>'
            f'</tr>'
        )
    return f"""
    <html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:30px 0;">
        <tr><td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
            <tr><td style="background:linear-gradient(90deg,#1c2a44,#ff7a00);padding:24px;text-align:center;color:#fff;">
              <div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;opacity:0.85;">All Best Fencing</div>
              <div style="font-size:22px;font-weight:800;margin-top:6px;">New Lead Captured</div>
            </td></tr>
            <tr><td style="padding:20px 24px;color:#334155;font-size:14px;">
              A prospective customer has submitted their details through your website.
            </td></tr>
            <tr><td style="padding:0 24px 24px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                {rows}
              </table>
            </td></tr>
            <tr><td style="padding:0 24px 28px 24px;">
              <a href="tel:+16043580406" style="display:inline-block;background:#ff7a00;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;">Call the lead back</a>
            </td></tr>
            <tr><td style="background:#0a1128;color:#94a3b8;padding:16px 24px;text-align:center;font-size:12px;">
              All Best Fencing &middot; +1 (604) 358-0406 &middot; allbestfencing@gmail.com
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>
    """


def _send_email_sync(lead: dict) -> bool:
    if not RESEND_API_KEY:
        logger.info("RESEND_API_KEY not configured — skipping email send (logged only).")
        return False
    try:
        subject_stage = "Partial" if lead.get("stage") == "partial" else "New"
        params = {
            "from": SENDER_EMAIL,
            "to": [LEAD_RECIPIENT_EMAIL],
            "subject": f"[{subject_stage} Lead] {lead.get('name') or lead.get('email') or lead.get('phone') or 'Website enquiry'}",
            "html": _build_email_html(lead),
        }
        result = resend.Emails.send(params)
        logger.info(f"Email sent: {result}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def _append_to_sheet_sync(lead: dict) -> bool:
    if not GOOGLE_SHEETS_ID or not GOOGLE_CREDENTIALS_PATH or not Path(GOOGLE_CREDENTIALS_PATH).exists():
        logger.info("Google Sheets not configured — skipping sheet log.")
        return False
    try:
        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]
        creds = Credentials.from_service_account_file(GOOGLE_CREDENTIALS_PATH, scopes=scopes)
        gc = gspread.authorize(creds)
        sh = gc.open_by_key(GOOGLE_SHEETS_ID)
        ws = sh.sheet1
        # ensure header
        try:
            first_row = ws.row_values(1)
        except Exception:
            first_row = []
        header = ["Timestamp", "Stage", "Name", "Phone", "Email", "Service", "City", "Project Details"]
        if not first_row:
            ws.append_row(header)
        ws.append_row([
            lead.get("created_at", ""),
            lead.get("stage", ""),
            lead.get("name", "") or "",
            lead.get("phone", "") or "",
            lead.get("email", "") or "",
            lead.get("service", "") or "",
            lead.get("city", "") or "",
            lead.get("project_details", "") or "",
        ])
        logger.info("Row appended to Google Sheet.")
        return True
    except Exception as e:
        logger.error(f"Google Sheet append failed: {e}")
        return False


async def _notify_lead(lead_doc: dict):
    """Background: send email + append to sheet. Both independent."""
    email_ok, sheet_ok = await asyncio.gather(
        asyncio.to_thread(_send_email_sync, lead_doc),
        asyncio.to_thread(_append_to_sheet_sync, lead_doc),
    )
    try:
        await db.leads.update_one(
            {"id": lead_doc["id"]},
            {"$set": {"notified": email_ok, "sheet_logged": sheet_ok}},
        )
    except Exception as e:
        logger.error(f"Failed to update lead notification flags: {e}")


# ============ Routes ============
@api_router.get("/")
async def root():
    return {"message": "All Best Fencing API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {
        "status": "ok",
        "resend_configured": bool(RESEND_API_KEY),
        "sheets_configured": bool(GOOGLE_SHEETS_ID and GOOGLE_CREDENTIALS_PATH and Path(GOOGLE_CREDENTIALS_PATH).exists()),
    }


@api_router.post("/leads/partial")
async def create_partial_lead(payload: LeadPartial, background: BackgroundTasks):
    """Called as soon as the user types an email or phone.
    Dedupes by (email, phone) so the same partial info isn't re-notified repeatedly."""
    phone_norm = _normalize_phone(payload.phone)
    email_norm = (payload.email or "").strip().lower()

    if not email_norm and len(phone_norm) < 7:
        raise HTTPException(status_code=400, detail="Provide a valid email or phone")

    # Dedupe check — same email/phone in last 24h at partial/full stage
    query = {"$or": []}
    if email_norm:
        query["$or"].append({"email": email_norm})
    if phone_norm:
        query["$or"].append({"phone_norm": phone_norm})
    existing = await db.leads.find_one(query, {"_id": 0}) if query["$or"] else None

    if existing:
        # update partial info (don't downgrade stage or re-notify)
        update = {}
        if payload.name and not existing.get("name"):
            update["name"] = payload.name
        if payload.email and not existing.get("email"):
            update["email"] = email_norm
        if payload.phone and not existing.get("phone"):
            update["phone"] = payload.phone
            update["phone_norm"] = phone_norm
        if update:
            await db.leads.update_one({"id": existing["id"]}, {"$set": update})
        return {"status": "exists", "id": existing["id"]}

    lead = Lead(
        name=payload.name,
        email=email_norm or None,
        phone=payload.phone or None,
        stage="partial",
    )
    doc = lead.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["phone_norm"] = phone_norm
    await db.leads.insert_one(doc)

    # fire-and-forget notifications
    background.add_task(_notify_lead, doc)
    return {"status": "created", "id": lead.id}


@api_router.post("/leads/submit")
async def create_full_lead(payload: LeadFull, background: BackgroundTasks):
    phone_norm = _normalize_phone(payload.phone)
    email_norm = (payload.email or "").strip().lower() if payload.email else None

    # Try to find existing partial
    query = {"$or": []}
    if email_norm:
        query["$or"].append({"email": email_norm})
    if phone_norm:
        query["$or"].append({"phone_norm": phone_norm})
    existing = await db.leads.find_one(query, {"_id": 0}) if query["$or"] else None

    if existing:
        update = {
            "name": payload.name,
            "phone": payload.phone,
            "phone_norm": phone_norm,
            "email": email_norm,
            "service": payload.service,
            "city": payload.city,
            "project_details": payload.project_details,
            "stage": "full",
        }
        await db.leads.update_one({"id": existing["id"]}, {"$set": update})
        doc = {**existing, **update}
        background.add_task(_notify_lead, doc)
        return {"status": "updated", "id": existing["id"]}

    lead = Lead(
        name=payload.name,
        phone=payload.phone,
        email=email_norm,
        service=payload.service,
        city=payload.city,
        project_details=payload.project_details,
        stage="full",
    )
    doc = lead.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["phone_norm"] = phone_norm
    await db.leads.insert_one(doc)
    background.add_task(_notify_lead, doc)
    return {"status": "created", "id": lead.id}


@api_router.get("/leads")
async def list_leads(limit: int = 200):
    leads = await db.leads.find({}, {"_id": 0, "phone_norm": 0}).sort("created_at", -1).to_list(limit)
    return {"count": len(leads), "leads": leads}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
