# Database Records

This document describes database record schemas and sample data for the Apply Utopia marketplace. Schemas are aligned with [Schema.org JobPosting](https://schema.org/JobPosting) and common job search engines (Indeed, Monster, LinkedIn).

---

## Summary

| Table | Purpose |
|-------|---------|
| **tenant_requests** | Onboarding requests from employers/orgs. Admin reviews; approved requests trigger tenant provisioning. |
| **tenants** | Provisioned sub-wallets (DID, wallet_id) from Marketplace Tenancy. One per approved tenant request. |
| **tenant_profiles** | Public display config for tenants (name, logo, description, contact). Used in discovery and employer cards. |
| **employers** | Employer config linked to a tenant. Owns job postings. |
| **job_postings** | Job listings. References employer; used for discovery and recommendations. |
| **workflow_instances** | Workflow Controller state (e.g. tenant provisioning). Tracks steps, status, payload. |

**Lifecycle**

```
Employer submits form → tenant_requests (pending)
                     → Admin approves → Workflow Controller → tenants (provisioned)
                     → tenant_profiles (display) + employers (config)
                     → job_postings (employer posts jobs)
```

**Holder flow**: Holder shares transcript → Credential Analysis → recommendations from `job_postings` (matched by skills/criteria).

---

## Job Posting

Based on [Schema.org JobPosting](https://schema.org/JobPosting). Maps to fields used by Indeed, Monster, and similar platforms.

### Table Schema

```sql
CREATE TABLE job_postings (
  id TEXT PRIMARY KEY,
  employer_id TEXT NOT NULL REFERENCES employers(id),

  -- Core (Schema.org: title, description)
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Dates (Schema.org: datePosted, validThrough, jobStartDate)
  date_posted TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_through TIMESTAMPTZ,
  job_start_date DATE,
  job_immediate_start BOOLEAN DEFAULT FALSE,

  -- Employment (Schema.org: employmentType, workHours)
  employment_type TEXT,           -- FULL_TIME | PART_TIME | CONTRACT | TEMPORARY | INTERNSHIP | VOLUNTEER
  work_hours TEXT,               -- e.g. "40 hours per week", "1st shift", "8am-5pm"

  -- Location (Schema.org: jobLocation, jobLocationType)
  location_city TEXT,
  location_region TEXT,          -- State/Province
  location_country TEXT DEFAULT 'US',
  location_type TEXT,            -- TELECOMMUTE | OFFICE | HYBRID

  -- Salary (Schema.org: baseSalary, estimatedSalary, salaryCurrency)
  salary_min DECIMAL(12, 2),
  salary_max DECIMAL(12, 2),
  salary_currency TEXT DEFAULT 'USD',
  salary_display TEXT,           -- e.g. "$80,000 - $100,000 per year"
  show_salary BOOLEAN DEFAULT TRUE,

  -- Requirements (Schema.org: educationRequirements, experienceRequirements, qualifications)
  education_requirements TEXT,
  experience_requirements TEXT,
  qualifications TEXT,           -- JSON array or text
  skills TEXT,                   -- JSON array or text

  -- Additional (Schema.org: jobBenefits, incentiveCompensation, responsibilities)
  benefits TEXT,
  incentive_compensation TEXT,
  responsibilities TEXT,

  -- Metadata
  industry TEXT,
  occupational_category TEXT,    -- O*NET-SOC code, e.g. "15-1132.00"
  total_openings INTEGER DEFAULT 1,
  direct_apply BOOLEAN DEFAULT TRUE,
  application_url TEXT,
  application_email TEXT,

  -- Display
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Schema.org Property Mapping

| DB Column | Schema.org Property |
|-----------|---------------------|
| title | title |
| description | description |
| date_posted | datePosted |
| valid_through | validThrough |
| job_start_date | jobStartDate |
| job_immediate_start | jobImmediateStart |
| employment_type | employmentType |
| work_hours | workHours |
| location_* | jobLocation (Place) |
| location_type | jobLocationType |
| salary_* | baseSalary / estimatedSalary |
| salary_currency | salaryCurrency |
| education_requirements | educationRequirements |
| experience_requirements | experienceRequirements |
| qualifications | qualifications |
| skills | skills |
| benefits | jobBenefits |
| incentive_compensation | incentiveCompensation |
| responsibilities | responsibilities |
| industry | industry |
| occupational_category | occupationalCategory |
| total_openings | totalJobOpenings |
| direct_apply | directApply |
| application_url | url (application) |

### Sample Record

```sql
INSERT INTO job_postings (
  id,
  employer_id,
  title,
  description,
  date_posted,
  valid_through,
  employment_type,
  work_hours,
  location_city,
  location_region,
  location_country,
  location_type,
  salary_min,
  salary_max,
  salary_currency,
  salary_display,
  education_requirements,
  experience_requirements,
  qualifications,
  benefits,
  industry,
  occupational_category,
  total_openings,
  featured
) VALUES (
  'urn:uuid:123e4567-e89b-12d3-a456-426614174011',
  'urn:uuid:123e4567-e89b-12d3-a456-426614174010',
  'Registered Nurse (RN)',
  'Join our nursing team. Provide direct patient care, administer medications, and collaborate with physicians. Full-time, day shift available.',
  '2024-01-15T00:00:00Z',
  '2024-06-30T23:59:59Z',
  'FULL_TIME',
  '40 hours per week, day shift',
  'Denver',
  'CO',
  'US',
  'OFFICE',
  65000.00,
  85000.00,
  'USD',
  '$65,000 - $85,000 per year',
  'Bachelor of Science in Nursing (BSN) or Associate Degree in Nursing (ADN)',
  '1+ years experience preferred',
  '["Valid RN license","BLS certification"]',
  'Medical, Dental, Vision, 401(k), PTO',
  'Healthcare',
  '29-1141.00 Registered Nurses',
  2,
  TRUE
);
```

### Sample Record (JSON)

```json
{
  "id": "urn:uuid:123e4567-e89b-12d3-a456-426614174011",
  "employer_id": "urn:uuid:123e4567-e89b-12d3-a456-426614174010",
  "title": "Registered Nurse (RN)",
  "description": "Join our nursing team. Provide direct patient care, administer medications, and collaborate with physicians. Full-time, day shift available.",
  "date_posted": "2024-01-15T00:00:00Z",
  "valid_through": "2024-06-30T23:59:59Z",
  "employment_type": "FULL_TIME",
  "work_hours": "40 hours per week, day shift",
  "location_city": "Denver",
  "location_region": "CO",
  "location_country": "US",
  "location_type": "OFFICE",
  "salary_min": 65000,
  "salary_max": 85000,
  "salary_currency": "USD",
  "salary_display": "$65,000 - $85,000 per year",
  "education_requirements": "Bachelor of Science in Nursing (BSN) or Associate Degree in Nursing (ADN)",
  "experience_requirements": "1+ years experience preferred",
  "qualifications": ["Valid RN license", "BLS certification"],
  "benefits": "Medical, Dental, Vision, 401(k), PTO",
  "industry": "Healthcare",
  "occupational_category": "29-1141.00 Registered Nurses",
  "total_openings": 2,
  "featured": true
}
```

### Employment Type Values

| Value | Description |
|-------|-------------|
| FULL_TIME | Full-time position |
| PART_TIME | Part-time position |
| CONTRACT | Contract / freelance |
| TEMPORARY | Temporary / seasonal |
| INTERNSHIP | Internship |
| VOLUNTEER | Volunteer |

### Location Type Values

| Value | Description |
|-------|-------------|
| OFFICE | On-site at employer location |
| TELECOMMUTE | Remote / work from home |
| HYBRID | Mix of on-site and remote |

---

## Tenant Request

Onboarding requests submitted via the Employer Onboard form. Reviewed by platform admin; approved requests trigger tenant provisioning (Workflow Controller → Marketplace Admin → Marketplace Tenancy).

### Table Schema

```sql
CREATE TABLE tenant_requests (
  id TEXT PRIMARY KEY,
  reference_id TEXT UNIQUE,         -- Short user-facing ID (e.g. REQ-7K2M9) for follow-up
  tenant_type TEXT NOT NULL,       -- Employer | Scholarship Admin | Education Institution

  -- Applicant / org info
  name TEXT NOT NULL,              -- Legal entity name
  email TEXT NOT NULL,

  -- KYC: contact person
  contact_name TEXT,
  contact_title TEXT,
  contact_phone TEXT,

  -- KYC: organization
  company_name TEXT,
  registration_id TEXT,            -- EIN, DUNS, company number
  jurisdiction TEXT,               -- Incorporation jurisdiction
  business_address TEXT,
  website TEXT,
  industry TEXT,

  -- KYC: intended use
  intended_use TEXT,

  -- Type-specific (conditional)
  hiring_volume TEXT,           -- Employer: 1-10 | 11-50 | 51-200 | 200+
  primary_industries TEXT,     -- Employer
  funding_source TEXT,         -- Scholarship Admin
  eligibility_overview TEXT,   -- Scholarship Admin
  accreditation TEXT,          -- Education Institution
  credential_types TEXT,       -- Education Institution

  -- Status & review
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,

  -- Metadata
  notes TEXT,                      -- Admin notes (internal)
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Tenant Type Values

| Value | Description |
|-------|-------------|
| Employer | Company hiring via marketplace |
| Scholarship Admin | Organization managing scholarships |
| Education Institution | School, college, or university |
| Government Service | Government agency or department (benefits, licenses, programs) |

### Status Values

| Value | Description |
|-------|-------------|
| pending | Awaiting admin review |
| approved | Approved; tenant provisioning started or completed |
| rejected | Rejected by admin |

### Sample Record

```sql
INSERT INTO tenant_requests (
  id,
  tenant_type,
  name,
  email,
  company_name,
  industry,
  status,
  submitted_at
) VALUES (
  'urn:uuid:123e4567-e89b-12d3-a456-426614174020',
  'Employer',
  'TechCorp Industries',
  'hr@techcorp.example.com',
  'TechCorp Industries',
  'Technology',
  'pending',
  '2025-01-28T10:00:00Z'
);
```

### Sample Record (JSON)

```json
{
  "id": "urn:uuid:123e4567-e89b-12d3-a456-426614174020",
  "tenantType": "Employer",
  "name": "TechCorp Industries",
  "email": "hr@techcorp.example.com",
  "companyName": "TechCorp Industries",
  "industry": "Technology",
  "status": "pending",
  "submittedAt": "2025-01-28T10:00:00Z"
}
```

---

## Tenant Profile

Public-facing profile for a provisioned tenant (employer or organization). Created after tenant provisioning; used for display in job listings, employer cards, and discovery. Links to `tenants` (provisioned sub-wallet).

### Table Schema

```sql
CREATE TABLE tenant_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE REFERENCES tenants(id),

  -- Display (Schema.org: Organization)
  display_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,

  -- Contact
  contact_email TEXT,
  contact_phone TEXT,

  -- Classification
  industry TEXT,
  tenant_type TEXT,                -- Employer | Scholarship Admin | Education Institution
  location_city TEXT,
  location_region TEXT,
  location_country TEXT,

  -- Branding & preferences
  primary_color TEXT,              -- Hex, e.g. "#1a73e8"
  accent_color TEXT,
  show_in_discovery BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships

```
tenant_requests (1) ──► tenants (1) ──► tenant_profiles (1)
     (onboarding)         (provisioned)      (display config)
                                 │
                                 └──► employers (1) ──► job_postings (*)
                                      (employer config)   (posted jobs)
```

- **tenant_profiles**: Public display (name, logo, description) for discovery and employer cards.
- **employers**: Employer config linked to tenant; `job_postings.employer_id` references `employers.id`. Display fields (name, logo) can be denormalized from `tenant_profiles` or stored on `employers` for query performance.

### Sample Record

```sql
INSERT INTO tenant_profiles (
  id,
  tenant_id,
  display_name,
  tagline,
  description,
  logo_url,
  website_url,
  contact_email,
  industry,
  tenant_type,
  location_city,
  location_country,
  primary_color,
  show_in_discovery,
  featured
) VALUES (
  'urn:uuid:123e4567-e89b-12d3-a456-426614174021',
  'urn:uuid:123e4567-e89b-12d3-a456-426614174019',
  'Denver Health Medical Center',
  'Care. Compassion. Community.',
  'Denver Health is a comprehensive healthcare system serving the Denver metro area. We employ over 8,000 people across hospitals, clinics, and community health centers.',
  'https://example.com/logos/denver-health.png',
  'https://www.denverhealth.org',
  'careers@denverhealth.org',
  'Healthcare',
  'Employer',
  'Denver',
  'US',
  '#0066cc',
  TRUE,
  TRUE
);
```

### Sample Record (JSON)

```json
{
  "id": "urn:uuid:123e4567-e89b-12d3-a456-426614174021",
  "tenantId": "urn:uuid:123e4567-e89b-12d3-a456-426614174019",
  "displayName": "Denver Health Medical Center",
  "tagline": "Care. Compassion. Community.",
  "description": "Denver Health is a comprehensive healthcare system serving the Denver metro area.",
  "logoUrl": "https://example.com/logos/denver-health.png",
  "websiteUrl": "https://www.denverhealth.org",
  "contactEmail": "careers@denverhealth.org",
  "industry": "Healthcare",
  "tenantType": "Employer",
  "locationCity": "Denver",
  "locationCountry": "US",
  "primaryColor": "#0066cc",
  "showInDiscovery": true,
  "featured": true
}
```
