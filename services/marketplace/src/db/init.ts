/**
 * Initialize database schema. Creates tables if they don't exist.
 */

import { dbConfig } from '../config';
import { getDb } from './index';

const SQLITE_SCHEMA = `
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
`;

const POSTGRES_SCHEMA = `
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
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  tenant_request_id TEXT REFERENCES tenant_requests(id),
  did TEXT,
  wallet_id TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id TEXT PRIMARY KEY,
  tenant_request_id TEXT REFERENCES tenant_requests(id),
  workflow_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  current_step TEXT,
  payload TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS credential_analysis_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS employer_profiles (
  employer_id TEXT PRIMARY KEY,
  credential TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_postings (
  id TEXT PRIMARY KEY,
  employer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date_posted TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_through TIMESTAMPTZ,
  employment_type TEXT,
  location_city TEXT,
  location_region TEXT,
  location_country TEXT DEFAULT 'US',
  location_type TEXT,
  salary_min DECIMAL(12, 2),
  salary_max DECIMAL(12, 2),
  salary_currency TEXT DEFAULT 'USD',
  salary_display TEXT,
  skills TEXT,
  qualifications TEXT,
  benefits TEXT,
  industry TEXT,
  credential TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
`;

function splitStatements(schema: string): string[] {
  return schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  const schema = dbConfig.type === 'postgres' ? POSTGRES_SCHEMA : SQLITE_SCHEMA;
  const statements = splitStatements(schema);
  for (const stmt of statements) {
    await db.run(stmt + ';');
  }
  // Migrations: add columns to existing tables (ignore if column exists)
  const migrations = [
    'ALTER TABLE tenant_requests ADD COLUMN reference_id TEXT',
    'ALTER TABLE tenants ADD COLUMN credential TEXT',
    'ALTER TABLE tenants ADD COLUMN status TEXT DEFAULT \'active\'',
  ];
  for (const sql of migrations) {
    try {
      await db.run(sql);
    } catch {
      // Column already exists
    }
  }
}
