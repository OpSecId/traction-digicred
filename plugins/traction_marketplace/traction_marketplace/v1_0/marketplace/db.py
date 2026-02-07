"""Marketplace plugin database layer - SQLite for tenants, requests, workflows, jobs, profiles."""

import json
import logging
import os
import uuid
from typing import Any, Optional

import aiosqlite

LOGGER = logging.getLogger(__name__)

SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS tenant_requests (
  id TEXT PRIMARY KEY,
  reference_id TEXT UNIQUE,
  tenant_type TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_name TEXT,
  contact_title TEXT,
  contact_phone TEXT,
  company_name TEXT,
  registration_id TEXT,
  jurisdiction TEXT,
  business_address TEXT,
  website TEXT,
  industry TEXT,
  intended_use TEXT,
  hiring_volume TEXT,
  primary_industries TEXT,
  funding_source TEXT,
  eligibility_overview TEXT,
  accreditation TEXT,
  credential_types TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  reviewed_by TEXT,
  rejection_reason TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  tenant_request_id TEXT REFERENCES tenant_requests(id),
  did TEXT,
  wallet_id TEXT,
  credential TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id TEXT PRIMARY KEY,
  tenant_request_id TEXT REFERENCES tenant_requests(id),
  workflow_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  current_step TEXT,
  payload TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS credential_analysis_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS employer_profiles (
  employer_id TEXT PRIMARY KEY,
  credential TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_postings (
  id TEXT PRIMARY KEY,
  employer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date_posted TEXT DEFAULT (datetime('now')),
  valid_through TEXT,
  employment_type TEXT,
  location_city TEXT,
  location_region TEXT,
  location_country TEXT DEFAULT 'US',
  location_type TEXT,
  salary_min REAL,
  salary_max REAL,
  salary_currency TEXT DEFAULT 'USD',
  salary_display TEXT,
  skills TEXT,
  qualifications TEXT,
  benefits TEXT,
  industry TEXT,
  credential TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
"""


def _db_path() -> str:
    """Path to SQLite database file."""
    path = os.environ.get("MARKETPLACE_DB_PATH", "./data/marketplace.db")
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    return path


async def get_db() -> aiosqlite.Connection:
    """Get database connection (caller must manage lifecycle)."""
    path = _db_path()
    return await aiosqlite.connect(path)


async def init_schema(conn: aiosqlite.Connection) -> None:
    """Create tables if they don't exist."""
    for stmt in SQLITE_SCHEMA.strip().split(";"):
        stmt = stmt.strip()
        if stmt:
            await conn.execute(stmt + ";")
    # Migrations
    for sql in [
        "ALTER TABLE tenant_requests ADD COLUMN reference_id TEXT",
        "ALTER TABLE tenants ADD COLUMN credential TEXT",
        "ALTER TABLE tenants ADD COLUMN status TEXT DEFAULT 'active'",
    ]:
        try:
            await conn.execute(sql)
        except aiosqlite.OperationalError:
            pass  # Column exists
    await conn.commit()


def _ref_id() -> str:
    return f"REQ-{uuid.uuid4().hex[:6].upper()}"


# --- Tenant requests ---


async def create_tenant_request(conn: aiosqlite.Connection, data: dict) -> dict:
    req_id = f"urn:uuid:{uuid.uuid4()}"
    ref_id = _ref_id()
    submitted = __import__("datetime").datetime.utcnow().isoformat() + "Z"
    row = (
        req_id,
        ref_id,
        data.get("tenantType", ""),
        data.get("name", ""),
        data.get("email", ""),
        data.get("contactName"),
        data.get("contactTitle"),
        data.get("contactPhone"),
        data.get("name"),  # company_name
        data.get("registrationId"),
        data.get("jurisdiction"),
        data.get("businessAddress"),
        data.get("website"),
        data.get("industry"),
        data.get("intendedUse"),
        data.get("hiringVolume"),
        data.get("primaryIndustries"),
        data.get("fundingSource"),
        data.get("eligibilityOverview"),
        data.get("accreditation"),
        data.get("credentialTypes"),
        "pending",
        submitted,
    )
    await conn.execute(
        """INSERT INTO tenant_requests (
            id, reference_id, tenant_type, name, email,
            contact_name, contact_title, contact_phone, company_name,
            registration_id, jurisdiction, business_address, website, industry,
            intended_use, hiring_volume, primary_industries, funding_source,
            eligibility_overview, accreditation, credential_types,
            status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        row,
    )
    await conn.commit()
    return await _get_tenant_request(conn, req_id)


async def list_tenant_requests(conn: aiosqlite.Connection) -> list[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute(
        "SELECT * FROM tenant_requests ORDER BY submitted_at DESC"
    )
    rows = await cur.fetchall()
    return [_tenant_request_row_to_json(dict(r)) for r in rows]


async def get_tenant_request(conn: aiosqlite.Connection, req_id: str) -> Optional[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute("SELECT * FROM tenant_requests WHERE id = ?", (req_id,))
    row = await cur.fetchone()
    return _tenant_request_row_to_json(dict(row)) if row else None


def _tenant_request_row_to_json(r: dict) -> dict:
    return {
        "id": r["id"],
        "referenceId": r.get("reference_id"),
        "tenantType": r["tenant_type"],
        "name": r["name"],
        "email": r["email"],
        "contactName": r.get("contact_name"),
        "contactTitle": r.get("contact_title"),
        "contactPhone": r.get("contact_phone"),
        "companyName": r.get("company_name"),
        "registrationId": r.get("registration_id"),
        "jurisdiction": r.get("jurisdiction"),
        "businessAddress": r.get("business_address"),
        "website": r.get("website"),
        "industry": r.get("industry"),
        "intendedUse": r.get("intended_use"),
        "hiringVolume": r.get("hiring_volume"),
        "primaryIndustries": r.get("primary_industries"),
        "fundingSource": r.get("funding_source"),
        "eligibilityOverview": r.get("eligibility_overview"),
        "accreditation": r.get("accreditation"),
        "credentialTypes": r.get("credential_types"),
        "status": r["status"],
        "submittedAt": r["submitted_at"],
        "reviewedAt": r.get("reviewed_at"),
        "reviewedBy": r.get("reviewed_by"),
        "rejectionReason": r.get("rejection_reason"),
        "notes": r.get("notes"),
    }


async def update_tenant_request_status(
    conn: aiosqlite.Connection,
    req_id: str,
    status: str,
    rejection_reason: Optional[str] = None,
) -> Optional[dict]:
    reviewed = __import__("datetime").datetime.utcnow().isoformat() + "Z"
    if status == "rejected" and rejection_reason:
        await conn.execute(
            """UPDATE tenant_requests SET status = ?, reviewed_at = ?, rejection_reason = ?, updated_at = ?
               WHERE id = ?""",
            (status, reviewed, rejection_reason, reviewed, req_id),
        )
    else:
        await conn.execute(
            """UPDATE tenant_requests SET status = ?, reviewed_at = ?, updated_at = ? WHERE id = ?""",
            (status, reviewed, reviewed, req_id),
        )
    await conn.commit()
    return await get_tenant_request(conn, req_id)


async def seed_tenant_requests(conn: aiosqlite.Connection, items: list[dict]) -> None:
    cur = await conn.execute("SELECT COUNT(*) FROM tenant_requests")
    (n,) = await cur.fetchone()
    if n > 0:
        return
    for r in items:
        ref_id = _ref_id()
        submitted = r.get("submittedAt") or __import__("datetime").datetime.utcnow().isoformat() + "Z"
        await conn.execute(
            """INSERT INTO tenant_requests (
                id, reference_id, tenant_type, name, email,
                contact_name, contact_title, contact_phone, company_name,
                registration_id, jurisdiction, business_address, website, industry,
                intended_use, hiring_volume, primary_industries, funding_source,
                eligibility_overview, accreditation, credential_types,
                status, submitted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                r.get("id", f"urn:uuid:{uuid.uuid4()}"),
                ref_id,
                r.get("tenantType", "Employer"),
                r.get("name", ""),
                r.get("email", ""),
                r.get("contactName"),
                r.get("contactTitle"),
                r.get("contactPhone"),
                r.get("name"),
                r.get("registrationId"),
                r.get("jurisdiction"),
                r.get("businessAddress"),
                r.get("website"),
                r.get("industry"),
                r.get("intendedUse"),
                r.get("hiringVolume"),
                r.get("primaryIndustries"),
                r.get("fundingSource"),
                r.get("eligibilityOverview"),
                r.get("accreditation"),
                r.get("credentialTypes"),
                "pending",
                submitted,
            ),
        )
    await conn.commit()
    LOGGER.info("Seeded %d tenant requests", len(items))


# --- Tenants ---


async def list_tenants(conn: aiosqlite.Connection) -> list[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute("SELECT * FROM tenants ORDER BY created_at DESC")
    rows = await cur.fetchall()
    return [_tenant_row_to_json(dict(r)) for r in rows]


async def get_tenant(conn: aiosqlite.Connection, tenant_id: str) -> Optional[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute("SELECT * FROM tenants WHERE id = ?", (tenant_id,))
    row = await cur.fetchone()
    return _tenant_row_to_json(dict(row)) if row else None


def _tenant_row_to_json(r: dict) -> dict:
    cred = r.get("credential")
    return {
        "id": r["id"],
        "tenantRequestId": r.get("tenant_request_id"),
        "did": r.get("did"),
        "walletId": r.get("wallet_id"),
        "credential": json.loads(cred) if cred else None,
        "status": r.get("status") or "active",
        "createdAt": r.get("created_at"),
    }


async def create_tenant(
    conn: aiosqlite.Connection,
    tenant_request_id: str,
    *,
    did: Optional[str] = None,
    wallet_id: Optional[str] = None,
    credential: Optional[dict] = None,
) -> Optional[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute(
        "SELECT * FROM tenants WHERE tenant_request_id = ?", (tenant_request_id,)
    )
    existing = await cur.fetchone()
    if existing:
        ex = dict(existing)
        if credential:
            await conn.execute(
                "UPDATE tenants SET credential = ? WHERE id = ?",
                (json.dumps(credential), ex["id"]),
            )
            await conn.commit()
            return await get_tenant(conn, ex["id"])
        return _tenant_row_to_json(ex)
    tenant_id = f"urn:uuid:{uuid.uuid4()}"
    cred_json = json.dumps(credential) if credential else None
    await conn.execute(
        """INSERT INTO tenants (id, tenant_request_id, did, wallet_id, credential, status)
           VALUES (?, ?, ?, ?, ?, 'active')""",
        (tenant_id, tenant_request_id, did, wallet_id, cred_json),
    )
    await conn.commit()
    return await get_tenant(conn, tenant_id)


async def create_tenant_manual(
    conn: aiosqlite.Connection,
    *,
    tenant_request_id: Optional[str] = None,
    did: Optional[str] = None,
    wallet_id: Optional[str] = None,
) -> Optional[dict]:
    if tenant_request_id:
        cur = await conn.execute(
            "SELECT * FROM tenants WHERE tenant_request_id = ?", (tenant_request_id,)
        )
        existing = await cur.fetchone()
        if existing:
            return _tenant_row_to_json(dict(existing))
    tenant_id = f"urn:uuid:{uuid.uuid4()}"
    await conn.execute(
        """INSERT INTO tenants (id, tenant_request_id, did, wallet_id) VALUES (?, ?, ?, ?)""",
        (tenant_id, tenant_request_id, did, wallet_id),
    )
    await conn.commit()
    return await get_tenant(conn, tenant_id)


async def revoke_tenant(conn: aiosqlite.Connection, tenant_id: str) -> bool:
    cur = await conn.execute(
        "UPDATE tenants SET status = ? WHERE id = ?", ("revoked", tenant_id)
    )
    await conn.commit()
    return cur.rowcount > 0


# --- Workflows ---


async def list_workflows(conn: aiosqlite.Connection) -> list[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute(
        "SELECT * FROM workflow_instances ORDER BY started_at DESC"
    )
    rows = await cur.fetchall()
    return [_workflow_row_to_json(dict(r)) for r in rows]


async def list_workflows_by_employer(
    conn: aiosqlite.Connection, employer_id: str
) -> list[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute(
        "SELECT tenant_request_id FROM tenants WHERE id = ?", (employer_id,)
    )
    row = await cur.fetchone()
    tenant_req_id = dict(row)["tenant_request_id"] if row else employer_id
    cur = await conn.execute(
        "SELECT * FROM workflow_instances WHERE tenant_request_id = ? ORDER BY started_at DESC",
        (tenant_req_id,),
    )
    rows = await cur.fetchall()
    return [_workflow_row_to_json(dict(r)) for r in rows]


def _workflow_row_to_json(r: dict) -> dict:
    return {
        "id": r["id"],
        "tenantRequestId": r.get("tenant_request_id"),
        "workflowType": r["workflow_type"],
        "status": r["status"],
        "currentStep": r.get("current_step"),
        "payload": json.loads(r["payload"]) if r.get("payload") else None,
        "startedAt": r["started_at"],
        "completedAt": r.get("completed_at"),
        "errorMessage": r.get("error_message"),
    }


async def create_workflow(
    conn: aiosqlite.Connection, tenant_request_id: str, workflow_type: str
) -> Optional[dict]:
    wf_id = f"urn:uuid:{uuid.uuid4()}"
    started = __import__("datetime").datetime.utcnow().isoformat() + "Z"
    await conn.execute(
        """INSERT INTO workflow_instances (id, tenant_request_id, workflow_type, status, started_at)
           VALUES (?, ?, ?, 'running', ?)""",
        (wf_id, tenant_request_id, workflow_type, started),
    )
    await conn.commit()
    return await _get_workflow(conn, wf_id)


async def _get_workflow(conn: aiosqlite.Connection, wf_id: str) -> Optional[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute("SELECT * FROM workflow_instances WHERE id = ?", (wf_id,))
    row = await cur.fetchone()
    return _workflow_row_to_json(dict(row)) if row else None


# --- Employer profiles ---


async def get_employer_profile(
    conn: aiosqlite.Connection, employer_id: str
) -> Optional[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute(
        "SELECT employer_id, credential FROM employer_profiles WHERE employer_id = ?",
        (employer_id,),
    )
    row = await cur.fetchone()
    if not row:
        return None
    r = dict(row)
    return {
        "employerId": r["employer_id"],
        "credential": json.loads(r["credential"]),
    }


async def create_employer_profile(
    conn: aiosqlite.Connection, employer_id: str, credential: dict
) -> None:
    now = __import__("datetime").datetime.utcnow().isoformat() + "Z"
    await conn.execute(
        """INSERT OR REPLACE INTO employer_profiles (employer_id, credential, created_at, updated_at)
           VALUES (?, ?, ?, ?)""",
        (employer_id, json.dumps(credential), now, now),
    )
    await conn.commit()


async def ensure_employer_profile(
    conn: aiosqlite.Connection, employer_id: str, credential: dict
) -> dict:
    existing = await get_employer_profile(conn, employer_id)
    if existing:
        return existing["credential"]
    await create_employer_profile(conn, employer_id, credential)
    return credential


# --- Job postings ---


def _job_row_to_json(r: dict) -> dict:
    return {
        "id": r["id"],
        "employerId": r["employer_id"],
        "title": r["title"],
        "description": r["description"],
        "datePosted": r["date_posted"],
        "validThrough": r.get("valid_through"),
        "employmentType": r.get("employment_type"),
        "locationCity": r.get("location_city"),
        "locationRegion": r.get("location_region"),
        "locationCountry": r.get("location_country"),
        "locationType": r.get("location_type"),
        "salaryMin": r.get("salary_min"),
        "salaryMax": r.get("salary_max"),
        "salaryCurrency": r.get("salary_currency"),
        "salaryDisplay": r.get("salary_display"),
        "skills": json.loads(r["skills"]) if r.get("skills") else None,
        "qualifications": json.loads(r["qualifications"]) if r.get("qualifications") else None,
        "benefits": r.get("benefits"),
        "industry": r.get("industry"),
        "credential": json.loads(r["credential"]) if r.get("credential") else None,
        "createdAt": r.get("created_at"),
        "updatedAt": r.get("updated_at"),
    }


async def create_job_posting(conn: aiosqlite.Connection, data: dict) -> dict:
    cred = data.get("credential")
    job_id = cred.get("id") if isinstance(cred, dict) else None
    if not job_id:
        job_id = f"urn:uuid:{uuid.uuid4()}"
    now = __import__("datetime").datetime.utcnow().isoformat() + "Z"
    await conn.execute(
        """INSERT INTO job_postings (
            id, employer_id, title, description, date_posted, valid_through,
            employment_type, location_city, location_region, location_country, location_type,
            salary_min, salary_max, salary_currency, salary_display,
            skills, qualifications, benefits, industry, credential
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            job_id,
            data["employerId"],
            data["title"],
            data["description"],
            now,
            data.get("validThrough"),
            data.get("employmentType"),
            data.get("locationCity"),
            data.get("locationRegion"),
            data.get("locationCountry") or "US",
            data.get("locationType"),
            data.get("salaryMin"),
            data.get("salaryMax"),
            data.get("salaryCurrency") or "USD",
            data.get("salaryDisplay"),
            json.dumps(data["skills"]) if data.get("skills") else None,
            json.dumps(data["qualifications"]) if data.get("qualifications") else None,
            data.get("benefits"),
            data.get("industry"),
            data.get("credential"),
        ),
    )
    await conn.commit()
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute("SELECT * FROM job_postings WHERE id = ?", (job_id,))
    row = await cur.fetchone()
    return _job_row_to_json(dict(row))


async def list_job_postings(
    conn: aiosqlite.Connection, employer_id: str
) -> list[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute(
        "SELECT * FROM job_postings WHERE employer_id = ? ORDER BY date_posted DESC",
        (employer_id,),
    )
    rows = await cur.fetchall()
    return [_job_row_to_json(dict(r)) for r in rows]


async def get_job_posting(
    conn: aiosqlite.Connection, job_id: str
) -> Optional[dict]:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute("SELECT * FROM job_postings WHERE id = ?", (job_id,))
    row = await cur.fetchone()
    return _job_row_to_json(dict(row)) if row else None


# --- Credential analysis config ---


DEFAULT_CREDENTIAL_ANALYSIS: dict = {
    "credentialTypes": [
        "CollegeTranscript",
        "HighSchoolTranscript",
        "Diploma",
        "StudentCard",
    ],
    "extraction": {
        "includeProgram": True,
        "includeGpa": True,
        "includeCourses": True,
        "maxCourses": 20,
    },
    "matching": {
        "matchFields": ["industry", "occupation", "educationRequirements"],
        "minScore": 0.2,
    },
    "enabled": True,
}


async def get_credential_analysis_config(
    conn: aiosqlite.Connection,
) -> dict:
    conn.row_factory = aiosqlite.Row
    cur = await conn.execute(
        "SELECT config FROM credential_analysis_config WHERE id = ?", ("default",)
    )
    row = await cur.fetchone()
    if row:
        try:
            return json.loads(dict(row)["config"])
        except (json.JSONDecodeError, KeyError):
            pass
    config = dict(DEFAULT_CREDENTIAL_ANALYSIS)
    await conn.execute(
        "INSERT INTO credential_analysis_config (id, config) VALUES (?, ?)",
        ("default", json.dumps(config)),
    )
    await conn.commit()
    return config


async def update_credential_analysis_config(
    conn: aiosqlite.Connection, config: dict, updated_by: Optional[str] = None
) -> dict:
    merged = {
        **DEFAULT_CREDENTIAL_ANALYSIS,
        **config,
        "extraction": {
            **DEFAULT_CREDENTIAL_ANALYSIS["extraction"],
            **config.get("extraction", {}),
        },
        "matching": {
            **DEFAULT_CREDENTIAL_ANALYSIS["matching"],
            **config.get("matching", {}),
        },
    }
    now = __import__("datetime").datetime.utcnow().isoformat() + "Z"
    await conn.execute(
        """INSERT INTO credential_analysis_config (id, config, updated_at, updated_by)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at, updated_by = excluded.updated_by""",
        ("default", json.dumps(merged), now, updated_by),
    )
    await conn.commit()
    return merged
