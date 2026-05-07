from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form, Depends, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import asyncio
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

import bcrypt
from jose import jwt, JWTError
from PIL import Image, ImageOps

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

# Admin auth + uploads
ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH", "").strip()
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me").strip()
JWT_ALGO = "HS256"
JWT_EXPIRE_HOURS = 24 * 7  # 7-day session
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/backend/uploads"))
PORTFOLIO_DIR = UPLOAD_DIR / "portfolio"
PORTFOLIO_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
MAX_IMAGE_BYTES = 12 * 1024 * 1024  # 12 MB
MAX_IMAGE_WIDTH = 1920
JPEG_QUALITY = 85

ALLOWED_CATEGORIES = [
    "Wood Fence",
    "Metal Fence",
    "Chain-link",
    "Vinyl/PVC",
    "Glass Railing",
    "Gates",
    "Other",
]
SERVICE_HERO_KEYS = ["wood", "metal", "chainlink", "vinyl", "glass", "gates", "privacy"]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login", auto_error=False)

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


class Photo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    url: str  # public URL e.g. /api/uploads/portfolio/<id>.jpg
    category: str = "Other"
    caption: Optional[str] = None
    featured: bool = False
    show_on_homepage: bool = True
    service_hero_for: Optional[str] = None  # one of SERVICE_HERO_KEYS
    order: int = 0
    width: Optional[int] = None
    height: Optional[int] = None
    size_bytes: Optional[int] = None
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LoginRequest(BaseModel):
    password: str


class PhotoUpdate(BaseModel):
    category: Optional[str] = None
    caption: Optional[str] = None
    featured: Optional[bool] = None
    show_on_homepage: Optional[bool] = None
    service_hero_for: Optional[str] = None
    order: Optional[int] = None


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


@api_router.post("/admin/send-document")
async def send_admin_document(
    email: str = Form(...),
    docType: str = Form(...),
    file: UploadFile = File(...)
):
    gmail_user = os.environ.get("GMAIL_USER", "allbestfencing@gmail.com")
    gmail_password = os.environ.get("GMAIL_APP_PASSWORD")
    
    if not gmail_password:
        raise HTTPException(status_code=500, detail="Gmail App Password not configured in .env")
    
    try:
        contents = await file.read()
        subject = f"Your {docType} from All Best Fencing"
        
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = f"All Best Fencing <{gmail_user}>"
        msg['To'] = email
        msg.set_content(f"Please find your {docType} attached.\n\nThank you,\nAll Best Fencing")
        msg.add_alternative(f"<p>Please find your {docType} attached.</p><br><p>Thank you,<br>All Best Fencing</p>", subtype='html')
        msg.add_attachment(contents, maintype='application', subtype='pdf', filename=file.filename)
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(gmail_user, gmail_password)
            smtp.send_message(msg)
            
        return {"status": "sent"}
    except Exception as e:
        logger.error(f"Failed to send doc via Gmail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Admin Auth ============
def _create_jwt(sub: str = "admin") -> str:
    payload = {
        "sub": sub,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def require_admin(token: Optional[str] = Depends(oauth2_scheme)) -> str:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        sub = payload.get("sub")
        if sub != "admin":
            raise HTTPException(status_code=401, detail="Invalid token")
        return sub
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@api_router.post("/admin/login")
async def admin_login(payload: LoginRequest):
    if not ADMIN_PASSWORD_HASH:
        raise HTTPException(status_code=500, detail="Admin password not configured on server")
    try:
        ok = bcrypt.checkpw(payload.password.encode("utf-8"), ADMIN_PASSWORD_HASH.encode("utf-8"))
    except Exception as e:
        logger.error(f"bcrypt check failed: {e}")
        raise HTTPException(status_code=500, detail="Auth error")
    if not ok:
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"access_token": _create_jwt(), "token_type": "bearer"}


@api_router.get("/admin/me")
async def admin_me(_: str = Depends(require_admin)):
    return {"ok": True, "role": "admin"}


# ============ Photo Upload + Management ============
def _save_image(file_bytes: bytes, ext: str) -> dict:
    """Compress, downsize, save to disk. Returns metadata."""
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img = ImageOps.exif_transpose(img)  # honour orientation
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    elif img.mode == "RGBA":
        # flatten transparency over white for JPEG
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1])
        img = bg

    if img.width > MAX_IMAGE_WIDTH:
        ratio = MAX_IMAGE_WIDTH / float(img.width)
        new_h = int(img.height * ratio)
        img = img.resize((MAX_IMAGE_WIDTH, new_h), Image.LANCZOS)

    photo_id = str(uuid.uuid4())
    save_name = f"{photo_id}.jpg"
    save_path = PORTFOLIO_DIR / save_name
    img.save(save_path, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    size = save_path.stat().st_size
    return {
        "id": photo_id,
        "filename": save_name,
        "width": img.width,
        "height": img.height,
        "size_bytes": size,
    }


@api_router.post("/admin/photos/upload")
async def upload_photos(
    files: List[UploadFile] = File(...),
    category: str = Form("Other"),
    caption: Optional[str] = Form(None),
    featured: bool = Form(False),
    show_on_homepage: bool = Form(True),
    service_hero_for: Optional[str] = Form(None),
    _: str = Depends(require_admin),
):
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Allowed: {ALLOWED_CATEGORIES}")
    if service_hero_for and service_hero_for not in SERVICE_HERO_KEYS:
        raise HTTPException(status_code=400, detail=f"Invalid service_hero_for. Allowed: {SERVICE_HERO_KEYS}")

    saved = []
    # Determine starting order (append to end)
    last = await db.photos.find_one({}, sort=[("order", -1)])
    next_order = (last.get("order", 0) + 1) if last else 1

    for upload in files:
        ext = Path(upload.filename or "").suffix.lower()
        if ext not in ALLOWED_IMAGE_EXTS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {upload.filename}")
        contents = await upload.read()
        if len(contents) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=400, detail=f"{upload.filename} exceeds 12 MB limit")

        meta = _save_image(contents, ext)
        photo = Photo(
            id=meta["id"],
            filename=meta["filename"],
            url=f"/api/uploads/portfolio/{meta['filename']}",
            category=category,
            caption=caption,
            featured=featured,
            show_on_homepage=show_on_homepage,
            service_hero_for=service_hero_for,
            order=next_order,
            width=meta["width"],
            height=meta["height"],
            size_bytes=meta["size_bytes"],
        )
        next_order += 1
        doc = photo.model_dump()
        doc["uploaded_at"] = doc["uploaded_at"].isoformat()

        # If this is service hero, clear other photos for that key
        if service_hero_for:
            await db.photos.update_many(
                {"service_hero_for": service_hero_for},
                {"$set": {"service_hero_for": None}},
            )
        await db.photos.insert_one(doc)
        saved.append({k: v for k, v in doc.items() if k != "_id"})
    return {"count": len(saved), "photos": saved}


@api_router.get("/admin/photos")
async def admin_list_photos(_: str = Depends(require_admin)):
    photos = await db.photos.find({}, {"_id": 0}).sort([("order", 1), ("uploaded_at", -1)]).to_list(1000)
    return {"count": len(photos), "photos": photos, "categories": ALLOWED_CATEGORIES, "service_keys": SERVICE_HERO_KEYS}


@api_router.patch("/admin/photos/{photo_id}")
async def update_photo(photo_id: str, update: PhotoUpdate, _: str = Depends(require_admin)):
    payload = {k: v for k, v in update.model_dump().items() if v is not None}
    if "category" in payload and payload["category"] not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    if "service_hero_for" in payload and payload["service_hero_for"] and payload["service_hero_for"] not in SERVICE_HERO_KEYS:
        raise HTTPException(status_code=400, detail="Invalid service_hero_for")
    # If setting a new service hero, clear it from any other photo
    if payload.get("service_hero_for"):
        await db.photos.update_many(
            {"service_hero_for": payload["service_hero_for"], "id": {"$ne": photo_id}},
            {"$set": {"service_hero_for": None}},
        )
    result = await db.photos.update_one({"id": photo_id}, {"$set": payload})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    photo = await db.photos.find_one({"id": photo_id}, {"_id": 0})
    return {"status": "updated", "photo": photo}


@api_router.delete("/admin/photos/{photo_id}")
async def delete_photo(photo_id: str, _: str = Depends(require_admin)):
    photo = await db.photos.find_one({"id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    try:
        path = PORTFOLIO_DIR / photo["filename"]
        if path.exists():
            path.unlink()
    except Exception as e:
        logger.error(f"Failed to delete file {photo.get('filename')}: {e}")
    await db.photos.delete_one({"id": photo_id})
    return {"status": "deleted", "id": photo_id}


@api_router.get("/photos")
async def list_public_photos(category: Optional[str] = None, limit: int = 200):
    """Public endpoint — only returns photos flagged show_on_homepage."""
    query = {"show_on_homepage": True}
    if category and category != "All":
        query["category"] = category
    photos = (
        await db.photos.find(query, {"_id": 0})
        .sort([("featured", -1), ("order", 1), ("uploaded_at", -1)])
        .to_list(limit)
    )
    return {"count": len(photos), "photos": photos}


@api_router.get("/services/hero-photos")
async def get_service_hero_photos():
    """Returns mapping of service_key -> photo url so frontend can override defaults."""
    cursor = db.photos.find({"service_hero_for": {"$ne": None}}, {"_id": 0})
    mapping = {}
    async for p in cursor:
        key = p.get("service_hero_for")
        if key and key not in mapping:
            mapping[key] = {"url": p.get("url"), "caption": p.get("caption")}
    return {"map": mapping}


app.include_router(api_router)

# Serve uploaded photos publicly (under /api/* so K8s ingress routes it to backend)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

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
