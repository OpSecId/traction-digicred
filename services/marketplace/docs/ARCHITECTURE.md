# Marketplace Architecture: Administration & Employer Tenant Onboarding

## System Overview

This document describes the architecture for the Apply Utopia marketplace, focusing on administration and employer tenant onboarding flows.

---

## Architecture Diagram

```mermaid
flowchart TB
    subgraph MarketplaceUI[Marketplace UI]
        Frontend[Frontend]
        Backend[Backend]
    end

    subgraph AdminAgent[Marketplace Admin]
        MarketplaceAdmin[single tenant - endorser]
        WorkflowController[Workflow Controller]
        CredentialAnalysisPlugin[Credential Analysis Plugin]
    end

    subgraph TenancyAgent[Marketplace Tenancy]
        MarketplaceTenancy[multitenant]
        InnkeeperPlugin[multitenancy / innkeeper plugin]
    end

    Frontend <--> Backend
    Backend <--> MarketplaceAdmin
    Backend <--> WorkflowController
    Backend <--> CredentialAnalysisPlugin
    Backend <--> MarketplaceTenancy
    WorkflowController <--> MarketplaceTenancy
    MarketplaceAdmin <--> MarketplaceTenancy
```

---

## Component Responsibilities

| Component | Role |
|-----------|------|
| **Marketplace UI (Frontend)** | Vue 3 PWA: discovery, transcript sharing, employer onboarding form, admin hub |
| **Marketplace UI (Backend)** | Express API: config, credentials, recommendations, tenant request CRUD |
| **Workflow Controller** | Orchestrates multi-step workflows: tenant provisioning, agent coordination, retries, state transitions |
| **Backend Database** | Stores tenant requests, jobs, employer config, workflow state |
| **Marketplace Admin** | Single-tenant ACA-Py: platform admin identity, tenant approval operations |
| **Marketplace Tenancy** | Multitenant ACA-Py: one sub-wallet per employer; handles tenant DIDs, credential issuance |
| **Credential Analysis Plugin** | Analyzes transcript credentials: extracts skills, courses, GPA; generates overview text; matches to job criteria |
| **DigiCred Mobile Wallet** | Holder wallet: stores credentials, responds to presentation requests for transcript sharing |

---

## Tenant Onboarding Flow (Sequence)

```mermaid
sequenceDiagram
    participant E as Employer
    participant UI as Marketplace UI
    participant DB as Database
    participant WC as Workflow Controller
    participant MA as Marketplace Admin
    participant MT as Marketplace Tenancy

    E->>UI: Submit onboarding (company, email)
    UI->>DB: Create tenant request (pending)
    E->>UI: (wait for approval)

    Note over UI,DB: Admin reviews in AdminHub

    participant A as Admin
    A->>UI: Approve request
    UI->>DB: Update status = approved
    UI->>WC: Start tenant provisioning (tenantRequestId)

    WC->>DB: Create workflow instance
    WC->>MA: Provision tenant (tenantRequestId)
    MA->>MT: Create tenant / sub-wallet
    MT->>MT: Generate tenant DID
    MT->>DB: Store tenant config (DID, wallet id)
    MT-->>MA: Tenant provisioned
    MA-->>WC: Success
    WC->>DB: Complete workflow, link tenant to employer
    WC-->>UI: Provisioning complete

    Note over E,MT: Employer can now post jobs, receive applicants
```

---

## Transcript / Credential Analysis Flow

```mermaid
sequenceDiagram
    participant H as Holder
    participant W as Wallet
    participant UI as Marketplace UI
    participant Backend as Backend
    participant CAP as CredentialAnalysisPlugin
    participant DB as Database

    H->>UI: Share my skills
    UI->>W: Presentation request (transcript)
    W->>UI: Present transcript (anon)
    UI->>Backend: POST /recommendations (credential data)

    Backend->>CAP: Analyze transcript (courses, GPA, program)
    CAP->>CAP: Extract skills, infer strengths
    CAP-->>Backend: Analysis result (skills, overview text)

    Backend->>DB: Query jobs by match criteria
    DB-->>Backend: Matching jobs
    Backend-->>UI: Recommendations + overview
    UI-->>H: Display tailored opportunities
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TENANT ONBOARDING FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Employer ──► Marketplace UI ──► Database (tenant_requests)            │
│       │              │                    │                             │
│       │              │                    └── pending                  │
│       │              │                                                    │
│       │              ▼                                                    │
│       │       Admin Hub (Admin reviews)                                   │
│       │              │                                                    │
│       │              ▼                                                    │
│       │       Approve ──► Workflow Controller                             │
│       │                         │                                          │
│       │                         ├──► Marketplace Admin ──► Marketplace Tenancy │
│       │                         │         │              │                │
│       │                         │         │              └── sub-wallet    │
│       │                         │         │              └── Tenant DID   │
│       │                         │         │                                │
│       │                         └──► Database (workflow state, tenants)   │
│       │                                                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     HOLDER / TRANSCRIPT FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Holder ──► DigiCred Wallet (credentials)                                │
│     │                                                                   │
│     └──► Marketplace UI ──► "Share transcript"                          │
│                │                                                        │
│                └──► Presentation request ──► Wallet                      │
│                │         │                                              │
│                │         └──► Holder presents transcript                │
│                │                                                        │
│                └──► Backend ──► Credential Analysis Plugin               │
│                │                    │                                   │
│                │                    └──► Skills, overview, matches      │
│                │                                                        │
│                └──► Backend ──► Recommendations (matched jobs)         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Proposed Database Schema (Tenant Onboarding)

```sql
-- Tenant onboarding requests (from EmployerOnboard form)
CREATE TABLE tenant_requests (
  id UUID PRIMARY KEY,
  tenant_type VARCHAR(50),      -- Employer | Scholarship Admin | Education Institution
  name VARCHAR(255),
  email VARCHAR(255),
  company_name VARCHAR(255),
  industry VARCHAR(100),
  submitted_at TIMESTAMPTZ,
  status VARCHAR(20),           -- pending | approved | rejected
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(255)
);

-- Provisioned tenants (after Marketplace Admin + Marketplace Tenancy)
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  tenant_request_id UUID REFERENCES tenant_requests(id),
  did VARCHAR(255),             -- Tenant DID from Tenancy Agent
  wallet_id VARCHAR(255),       -- Sub-wallet identifier
  created_at TIMESTAMPTZ
);

-- Employer config (jobs, etc.) linked to tenant
CREATE TABLE employers (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255),
  logo_url VARCHAR(500),
  -- ...
);

-- Workflow instances (Workflow Controller state)
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY,
  tenant_request_id UUID REFERENCES tenant_requests(id),
  workflow_type VARCHAR(50),     -- e.g. 'tenant_provisioning'
  status VARCHAR(20),             -- running | completed | failed
  current_step VARCHAR(100),
  payload JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);
```

---

## Open Questions / Next Steps

1. **Workflow Controller**: Temporal, Camunda, custom state machine, or event-driven (e.g. Redis + workers)?
2. **Marketplace Admin ↔ Marketplace Tenancy**: REST, internal queue, or direct ACA-Py admin API?
3. **Wallet connectivity**: How does Marketplace UI connect to Marketplace Admin/Tenancy? (HTTP, WebSocket, mediator?)
4. **Holder ↔ Employer**: After tenant provisioning, how do applicants connect? OOB invitation from employer?
5. **Credential issuance**: Does Tenancy Agent issue employer credentials to the wallet, or is that separate?
6. **Credential Analysis Plugin**: ACA-Py plugin (runs in agent) vs standalone microservice? AI/LLM for overview text?

