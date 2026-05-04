"""Backend API tests for All Best Fencing.

Covers:
- Health endpoint
- Progressive partial-lead capture (email/phone validation, dedupe)
- Full lead submission (creates new / upgrades partial -> full)
- Listing leads (newest first, no _id, no phone_norm)
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # frontend env contains the public URL the user hits
    from pathlib import Path
    env = Path("/app/frontend/.env").read_text()
    for line in env.splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"')
            break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Unique tag so tests don't collide with each other or earlier runs
TAG = uuid.uuid4().hex[:8]


# ---------- Health ----------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_health(self, session):
        r = session.get(f"{API}/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert "resend_configured" in data
        assert "sheets_configured" in data
        assert isinstance(data["resend_configured"], bool)
        assert isinstance(data["sheets_configured"], bool)


# ---------- Partial leads ----------
class TestPartialLead:
    def test_partial_email_creates(self, session):
        email = f"test_{TAG}_email@example.com"
        r = session.post(f"{API}/leads/partial", json={"email": email})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "created"
        assert "id" in body and isinstance(body["id"], str)

        # Verify it appears in /api/leads
        time.sleep(0.3)
        leads = session.get(f"{API}/leads").json()["leads"]
        assert any(l.get("email") == email for l in leads)

    def test_partial_phone_creates(self, session):
        phone = f"604555{int(time.time()) % 10000:04d}"
        # ensure 10 digits
        phone = phone[:10].ljust(10, "0")
        r = session.post(f"{API}/leads/partial", json={"phone": phone})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "created"

    def test_partial_invalid_returns_400(self, session):
        # No email and phone too short (<7 digits)
        r = session.post(f"{API}/leads/partial", json={"phone": "123"})
        assert r.status_code == 400
        # also test totally empty
        r2 = session.post(f"{API}/leads/partial", json={})
        assert r2.status_code == 400

    def test_partial_dedupe_same_email(self, session):
        email = f"test_{TAG}_dup@example.com"
        r1 = session.post(f"{API}/leads/partial", json={"email": email})
        assert r1.status_code == 200
        assert r1.json()["status"] == "created"
        r2 = session.post(f"{API}/leads/partial", json={"email": email})
        assert r2.status_code == 200
        assert r2.json()["status"] == "exists"
        # ids should match
        assert r1.json()["id"] == r2.json()["id"]


# ---------- Full lead ----------
class TestFullLead:
    def test_submit_creates_new(self, session):
        payload = {
            "name": f"TEST_{TAG} User",
            "phone": "6045550101",
            "email": f"test_{TAG}_full@example.com",
            "service": "Wood Fencing",
            "city": "Surrey",
            "project_details": "About 50ft of cedar privacy fence",
        }
        r = session.post(f"{API}/leads/submit", json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] in ("created", "updated")
        lead_id = body["id"]

        # GET /api/leads and verify persistence + stage:full
        time.sleep(0.3)
        leads = session.get(f"{API}/leads").json()["leads"]
        match = next((l for l in leads if l.get("id") == lead_id), None)
        assert match is not None, "submitted lead not found in /api/leads"
        assert match["stage"] == "full"
        assert match["name"] == payload["name"]
        assert match["service"] == "Wood Fencing"
        assert match["city"] == "Surrey"

    def test_submit_upgrades_partial(self, session):
        email = f"test_{TAG}_upgrade@example.com"
        # 1) Create partial
        r1 = session.post(f"{API}/leads/partial", json={"email": email})
        assert r1.status_code == 200
        partial_id = r1.json()["id"]

        # 2) Submit full with same email -> should "update"
        r2 = session.post(
            f"{API}/leads/submit",
            json={
                "name": f"TEST_{TAG} Upgrade",
                "phone": "6045550202",
                "email": email,
                "service": "Aluminum Fencing",
                "city": "Vancouver",
            },
        )
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert body["status"] == "updated"
        assert body["id"] == partial_id

        # 3) Verify stage changed to full
        time.sleep(0.3)
        leads = session.get(f"{API}/leads").json()["leads"]
        match = next((l for l in leads if l.get("id") == partial_id), None)
        assert match is not None
        assert match["stage"] == "full"
        assert match["service"] == "Aluminum Fencing"


# ---------- Listing ----------
class TestListLeads:
    def test_list_shape_and_no_internal_fields(self, session):
        r = session.get(f"{API}/leads")
        assert r.status_code == 200
        body = r.json()
        assert "count" in body and "leads" in body
        assert isinstance(body["leads"], list)
        assert body["count"] == len(body["leads"])
        for lead in body["leads"]:
            assert "_id" not in lead, "_id must be excluded"
            assert "phone_norm" not in lead, "phone_norm must be excluded"
            assert "id" in lead
            assert "stage" in lead

    def test_list_newest_first(self, session):
        # create a fresh lead
        email = f"test_{TAG}_newest@example.com"
        r = session.post(f"{API}/leads/partial", json={"email": email})
        assert r.status_code == 200
        new_id = r.json()["id"]
        time.sleep(0.3)
        leads = session.get(f"{API}/leads").json()["leads"]
        assert len(leads) > 0
        # The newly created lead should be at or near the top (newest first sort)
        top_ids = [l["id"] for l in leads[:5]]
        assert new_id in top_ids
