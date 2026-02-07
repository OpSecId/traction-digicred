import 'dotenv/config';
import { randomUUID } from 'crypto';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { adminController } from './controllers/adminController';
import { tenancyController } from './controllers/tenancyController';
import type { TenantRequestInput } from './controllers/tenantController';
import type { CredentialAnalysisConfig } from './controllers/credentialAnalysisController';
import { marketplaceController } from './controllers/marketplaceController';
import {
  getActionMenuConfig,
  updateActionMenuConfig,
} from './controllers/actionMenuController';
import {
  issueMarketplaceProfileCredential,
  buildMarketplaceProfileCredential,
} from './controllers/credentialIssuanceController';
import { buildJobPostingCredential } from './controllers/jobPostingController';
import { buildEmployerProfileCredential } from './controllers/employerProfileController';
import { pluginDb } from './controllers/pluginDbController';
import { getMongoDb } from './db/mongodb';
import {
  tenantRequestRepo,
  tenantRepo,
  workflowRepo,
  employerProfileRepo,
  jobPostingRepo,
  credentialAnalysisConfigRepo,
} from './repositories/mongo';

const app = express();
const PORT = Number(process.env.PORT) || 5174;

// CORS: set CORS_ORIGIN env (comma-separated) to restrict origins in production
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors(
    corsOrigin
      ? { origin: corsOrigin.split(',').map((o) => o.trim()) }
      : { origin: true }
  )
);
app.use(express.json());

function loadDemoConfig(): unknown {
  const candidates = [
    path.join(__dirname, '../config/demo.yaml'),
    path.join(process.cwd(), 'config/demo.yaml'),
    path.join(__dirname, '../frontend/public/demo.json'),
    path.join(process.cwd(), 'frontend/public/demo.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const contents = fs.readFileSync(p, 'utf8');
        return p.endsWith('.json') ? JSON.parse(contents) : yaml.load(contents);
      }
    } catch {
      continue;
    }
  }
  throw new Error(`Demo config not found. Tried: ${candidates.join(', ')}`);
}

function loadTrustRegistry(): unknown {
  const candidates = [
    path.join(__dirname, '../config/trust-registry.yaml'),
    path.join(process.cwd(), 'config/trust-registry.yaml'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const contents = fs.readFileSync(p, 'utf8');
        const data = yaml.load(contents) as { registries?: unknown[] };
        return { registries: data.registries ?? [] };
      }
    } catch {
      continue;
    }
  }
  return { registries: [] };
}

// Agent status (for health checks / ops)
app.get('/api/agents/admin/status', async (_req, res) => {
  try {
    const status = await adminController.status();
    res.json(status);
  } catch (err) {
    console.error('Admin agent status error:', err);
    res.status(500).json({ error: 'Failed to check admin agent status' });
  }
});

app.get('/api/agents/tenancy/status', async (_req, res) => {
  try {
    const status = await tenancyController.status();
    res.json(status);
  } catch (err) {
    console.error('Tenancy agent status error:', err);
    res.status(500).json({ error: 'Failed to check tenancy agent status' });
  }
});

// MongoDB status (for health checks / ops)
app.get('/api/mongo/status', async (_req, res) => {
  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    res.json({ ok: true, database: db.databaseName });
  } catch (err) {
    console.error('MongoDB status error:', err);
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Connection failed' });
  }
});

// Employer login (validates against employerLogins in config)
app.post('/api/auth/employer-login', (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const config = loadDemoConfig() as {
      employerLogins?: Array<{ employerId: string; email: string; password: string }>;
    };
    const logins = config.employerLogins ?? [];
    const match = logins.find(
      (l) => l.email.toLowerCase() === String(email).toLowerCase().trim() && l.password === password
    );
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const personas = (config as { personas?: Array<{ id: string; name: string }> }).personas ?? [];
    const employer = personas.find((p) => p.id === match.employerId);
    res.json({
      employerId: match.employerId,
      employerName: employer?.name ?? 'Employer',
    });
  } catch (err) {
    console.error('Employer login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin login (validates against adminLogins in config)
app.post('/api/auth/admin-login', (req, res) => {
  console.log('Admin login request received');
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const config = loadDemoConfig() as {
      adminLogins?: Array<{ email: string; password: string }>;
    };
    const logins = config.adminLogins ?? [];
    if (logins.length === 0) {
      console.warn('Admin login: no adminLogins in config');
    }
    const match = logins.find(
      (l) => l.email.toLowerCase() === String(email).toLowerCase().trim() && l.password === password
    );
    if (!match) {
      console.warn('Admin login failed: no match for', email);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    console.log('Admin login success:', email);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Serve demo config from YAML or JSON fallback
app.get('/api/config/demo', (_req, res) => {
  try {
    const config = loadDemoConfig();
    res.json(config);
  } catch (err) {
    console.error('Error loading demo config:', err);
    res.status(500).json({ error: 'Failed to load demo configuration' });
  }
});

// Get credentials for presentation request (demo: student's transcript-type credentials only)
// Filters by action menu's presentationRequestCredentialTypes when configured
app.get('/api/presentation-request/credentials', (_req, res) => {
  try {
    const actionMenu = getActionMenuConfig();
    const allowedTypes =
      actionMenu.presentationRequestCredentialTypes?.length
        ? new Set(actionMenu.presentationRequestCredentialTypes)
        : null;
    const config = loadDemoConfig() as {
      personas: Array<{
        type: string;
        credentials?: Array<{
          id: string;
          type: string;
          name: string;
          establishmentName?: string;
          image?: string;
          logo?: string;
          credentialSubject?: unknown;
        }>;
      }>;
    };
    const student = (config.personas || []).find((p) => p.type === 'Student');
    const raw = (student?.credentials || []).filter((c) => {
      if (!c.type) return false;
      if (allowedTypes) return allowedTypes.has(c.type);
      return c.type.toLowerCase().includes('transcript');
    });
    const credentials = raw.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      establishmentName: c.establishmentName,
      backgroundImage: c.image,
      logo: c.logo,
      credentialSubject: c.credentialSubject,
    }));
    res.json({ credentials });
  } catch (err) {
    console.error('Error loading credentials:', err);
    res.status(500).json({ error: 'Failed to load credentials' });
  }
});

// Tenant requests - submit for review, list, approve/reject (MongoDB)
app.post('/api/tenant-requests', async (req, res) => {
  try {
    const body = req.body as TenantRequestInput;
    if (!body?.tenantType || !body?.name || !body?.email) {
      res.status(400).json({ error: 'tenantType, name, and email are required' });
      return;
    }
    const created = await tenantRequestRepo.create(body as unknown as Record<string, unknown>);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating tenant request:', err);
    res.status(500).json({ error: 'Failed to create tenant request' });
  }
});

app.get('/api/tenant-requests', async (_req, res) => {
  try {
    const requests = await tenantRequestRepo.list();
    res.json({ requests });
  } catch (err) {
    console.error('Error listing tenant requests:', err);
    res.status(500).json({ error: 'Failed to list tenant requests' });
  }
});

app.patch('/api/tenant-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as { status?: 'approved' | 'rejected'; rejectionReason?: string };
    if (!body?.status || !['approved', 'rejected'].includes(body.status)) {
      res.status(400).json({ error: 'status must be "approved" or "rejected"' });
      return;
    }
    const updated = await tenantRequestRepo.updateStatus(id, body.status, {
      rejectionReason: body.rejectionReason,
    });
    if (!updated) {
      res.status(404).json({ error: 'Tenant request not found' });
      return;
    }
    if (body.status === 'approved') {
      await workflowRepo.create(id, 'verify-tenant');
      const upd = updated as Record<string, unknown>;
      // Issue MarketplaceProfileCredential via agent /vc/sign; store on tenant
      const signedCredential = await issueMarketplaceProfileCredential({
        id: String(upd.id ?? ''),
        name: String(upd.name ?? ''),
        email: String(upd.email ?? ''),
        tenantType: String(upd.tenantType ?? ''),
        industry: upd.industry as string | undefined,
        website: upd.website as string | undefined,
        businessAddress: upd.businessAddress as string | undefined,
      });
      const credentialToStore = signedCredential ?? buildMarketplaceProfileCredential({
        id: String(upd.id ?? ''),
        name: String(upd.name ?? ''),
        email: String(upd.email ?? ''),
        tenantType: String(upd.tenantType ?? ''),
        industry: upd.industry as string | undefined,
        website: upd.website as string | undefined,
        businessAddress: upd.businessAddress as string | undefined,
      });
      // Provision tenant via plugin (creates sub-wallet), then save to MongoDB
      const tenant = await pluginDb.createTenant(id, { credential: credentialToStore });
      if (tenant) {
        await tenantRepo.saveFromPlugin(tenant);
        // Create employer_profiles for Employer tenants (profile credential created on approval, not first job)
        if (upd.tenantType === 'Employer') {
          await employerProfileRepo.create(String(tenant.id), credentialToStore);
        }
      }
      if (signedCredential) {
        console.log('Issued MarketplaceProfileCredential for', upd.name);
      }
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating tenant request:', err);
    res.status(500).json({ error: 'Failed to update tenant request' });
  }
});

// Admin: list tenants (provisioned sub-wallets) - MongoDB
app.get('/api/admin/tenants', async (_req, res) => {
  try {
    const tenants = await tenantRepo.list();
    res.json({ tenants });
  } catch (err) {
    console.error('Error listing tenants:', err);
    res.status(500).json({ error: 'Failed to list tenants' });
  }
});

// Admin: get tenant details (with request info and credential) - MongoDB
app.get('/api/admin/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await tenantRepo.getById(id);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    let tenantRequest = null;
    const tenantRequestId = tenant.tenantRequestId as string | undefined;
    if (tenantRequestId) {
      tenantRequest = await tenantRequestRepo.getById(tenantRequestId);
    }
    res.json({ tenant, tenantRequest });
  } catch (err) {
    console.error('Error fetching tenant:', err);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// Admin: revoke tenant access - MongoDB
app.post('/api/admin/tenants/:id/revoke', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await tenantRepo.revoke(id);
    if (!ok) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    res.json({ revoked: true });
  } catch (err) {
    console.error('Error revoking tenant:', err);
    res.status(500).json({ error: 'Failed to revoke tenant' });
  }
});

// Admin: create tenant (out-of-band onboarding) - MongoDB
app.post('/api/admin/tenants', async (req, res) => {
  try {
    const body = req.body as { tenantRequestId?: string; did?: string; walletId?: string };
    const tenant = await tenantRepo.createManual({
      tenantRequestId: body.tenantRequestId?.trim() || undefined,
      did: body.did?.trim() || undefined,
      walletId: body.walletId?.trim() || undefined,
    });
    res.status(201).json(tenant);
  } catch (err) {
    console.error('Error creating tenant:', err);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Admin: credential analysis workflow config - MongoDB
app.get('/api/admin/credential-analysis', async (_req, res) => {
  try {
    const config = await credentialAnalysisConfigRepo.get();
    res.json(config);
  } catch (err) {
    console.error('Error loading credential analysis config:', err);
    res.status(500).json({ error: 'Failed to load credential analysis config' });
  }
});

app.put('/api/admin/credential-analysis', async (req, res) => {
  try {
    const body = req.body as Partial<CredentialAnalysisConfig>;
    const config = await credentialAnalysisConfigRepo.update(body as Record<string, unknown>);
    res.json(config);
  } catch (err) {
    console.error('Error updating credential analysis config:', err);
    res.status(500).json({ error: 'Failed to update credential analysis config' });
  }
});

// Admin: list trust registries (from config)
app.get('/api/admin/trust-registries', (_req, res) => {
  try {
    const registry = loadTrustRegistry() as { registries?: unknown[] };
    res.json({ trustRegistries: registry.registries ?? [] });
  } catch (err) {
    console.error('Error loading trust registry:', err);
    res.status(500).json({ error: 'Failed to load trust registry' });
  }
});

// Admin: list workflow instances - MongoDB
app.get('/api/admin/workflows', async (_req, res) => {
  try {
    const workflows = await workflowRepo.list();
    res.json({ workflows });
  } catch (err) {
    console.error('Error listing workflows:', err);
    res.status(500).json({ error: 'Failed to list workflows' });
  }
});

// Admin: create workflow instance (e.g. trigger tenant provisioning) - MongoDB
app.post('/api/admin/workflows', async (req, res) => {
  try {
    const { tenantRequestId, workflowType } = req.body as { tenantRequestId?: string; workflowType?: string };
    if (!tenantRequestId || !workflowType) {
      res.status(400).json({ error: 'tenantRequestId and workflowType are required' });
      return;
    }
    const workflow = await workflowRepo.create(tenantRequestId, workflowType);
    res.status(201).json(workflow);
  } catch (err) {
    console.error('Error creating workflow:', err);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Marketplace plugin: create OOB invitation (proxies to ACA-Py agent)
app.post('/api/admin/marketplace/invitation', async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const result = await marketplaceController.createInvitation(body);
    res.json(result);
  } catch (err) {
    console.error('Marketplace create invitation error:', err);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// Marketplace plugin: analyze transcript (proxies to ACA-Py agent)
app.post('/api/admin/marketplace/analyze-transcript', async (req, res) => {
  try {
    const { credential_data } = req.body as { credential_data?: Record<string, unknown> };
    if (!credential_data) {
      res.status(400).json({ error: 'credential_data is required' });
      return;
    }
    const result = await marketplaceController.analyzeTranscript({ credential_data });
    res.json(result);
  } catch (err) {
    console.error('Marketplace analyze transcript error:', err);
    res.status(500).json({ error: 'Failed to analyze transcript' });
  }
});

// Action menu config (stored in YAML; sent to holders when plugin implements it)
app.get('/api/admin/marketplace/action-menu', (_req, res) => {
  try {
    const config = getActionMenuConfig();
    res.json(config);
  } catch (err) {
    console.error('Action menu config error:', err);
    res.status(500).json({ error: 'Failed to load action menu config' });
  }
});

app.put('/api/admin/marketplace/action-menu', (req, res) => {
  try {
    const body = req.body as {
      title?: string;
      description?: string;
      items?: Array<{ title: string; description?: string }>;
      presentationRequestCredentialTypes?: string[];
    };
    const config = updateActionMenuConfig(body);
    res.json(config);
  } catch (err) {
    console.error('Action menu config error:', err);
    res.status(500).json({ error: 'Failed to update action menu config' });
  }
});

// Employer: create job posting (with JobPostingCredential, no proof) - MongoDB
app.post('/api/employer/jobs', async (req, res) => {
  try {
    const body = req.body as Record<string, unknown> & { employerId?: string; employerName?: string };
    if (!body?.employerId || !body?.employerName || !body?.title || !body?.description) {
      res.status(400).json({ error: 'employerId, employerName, title, and description are required' });
      return;
    }
    // Ensure employer profile exists (MongoDB)
    const profileCred = buildEmployerProfileCredential({
      employerId: body.employerId,
      employerName: body.employerName,
      employerEmail: typeof body.employerEmail === 'string' ? body.employerEmail : undefined,
      industry: typeof body.employerIndustry === 'string' ? body.employerIndustry : undefined,
      website: typeof body.employerWebsite === 'string' ? body.employerWebsite : undefined,
    });
    await employerProfileRepo.ensure(body.employerId, profileCred);
    // Build job credential and create in MongoDB
    const jobId = `urn:uuid:${randomUUID()}`;
    const credential = buildJobPostingCredential(jobId, {
      employerId: body.employerId,
      employerName: body.employerName,
      employerEmail: typeof body.employerEmail === 'string' ? body.employerEmail : undefined,
      employerIndustry: typeof body.employerIndustry === 'string' ? body.employerIndustry : undefined,
      employerWebsite: typeof body.employerWebsite === 'string' ? body.employerWebsite : undefined,
      title: String(body.title),
      description: String(body.description),
      employmentType: typeof body.employmentType === 'string' ? body.employmentType : undefined,
      locationCity: typeof body.locationCity === 'string' ? body.locationCity : undefined,
      locationRegion: typeof body.locationRegion === 'string' ? body.locationRegion : undefined,
      locationCountry: typeof body.locationCountry === 'string' ? body.locationCountry : undefined,
      locationType: typeof body.locationType === 'string' ? body.locationType : undefined,
      salaryMin: typeof body.salaryMin === 'number' ? body.salaryMin : undefined,
      salaryMax: typeof body.salaryMax === 'number' ? body.salaryMax : undefined,
      salaryCurrency: typeof body.salaryCurrency === 'string' ? body.salaryCurrency : undefined,
      salaryDisplay: typeof body.salaryDisplay === 'string' ? body.salaryDisplay : undefined,
      skills: Array.isArray(body.skills) ? body.skills : undefined,
      qualifications: Array.isArray(body.qualifications) ? body.qualifications : undefined,
      benefits: typeof body.benefits === 'string' ? body.benefits : undefined,
      industry: typeof body.industry === 'string' ? body.industry : undefined,
      validThrough: typeof body.validThrough === 'string' ? body.validThrough : undefined,
    });
    const job = await jobPostingRepo.create({
      id: jobId,
      employerId: body.employerId,
      employerName: body.employerName,
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      employerEmail: body.employerEmail,
      employerIndustry: body.employerIndustry,
      employerWebsite: body.employerWebsite,
      employmentType: body.employmentType,
      locationCity: body.locationCity,
      locationRegion: body.locationRegion,
      locationCountry: body.locationCountry,
      locationType: body.locationType,
      salaryMin: body.salaryMin,
      salaryMax: body.salaryMax,
      salaryCurrency: body.salaryCurrency,
      salaryDisplay: body.salaryDisplay,
      skills: body.skills,
      qualifications: body.qualifications,
      benefits: body.benefits,
      industry: body.industry,
      validThrough: body.validThrough,
      credential,
    });
    res.status(201).json(job);
  } catch (err) {
    console.error('Error creating job posting:', err);
    res.status(500).json({ error: 'Failed to create job posting' });
  }
});

// Get single job posting by id (for JobDetail when not in store) - MongoDB
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await jobPostingRepo.getById(id);
    if (!job) {
      res.status(404).json({ error: 'Job posting not found' });
      return;
    }
    res.json(job);
  } catch (err) {
    console.error('Error fetching job posting:', err);
    res.status(500).json({ error: 'Failed to fetch job posting' });
  }
});

// Employer: get profile credential - MongoDB
// Returns 200 with null credential when profile doesn't exist yet (employer can create first job to establish profile)
app.get('/api/employer/profile', async (req, res) => {
  try {
    const employerId = req.query.employerId as string;
    if (!employerId) {
      res.status(400).json({ error: 'employerId query parameter is required' });
      return;
    }
    const profile = await employerProfileRepo.get(employerId);
    if (!profile) {
      res.json({ employerId, credential: null });
      return;
    }
    res.json(profile);
  } catch (err) {
    console.error('Error fetching employer profile:', err);
    res.status(500).json({ error: 'Failed to fetch employer profile' });
  }
});

// Employer: list job postings by employer - MongoDB
app.get('/api/employer/jobs', async (req, res) => {
  try {
    const employerId = req.query.employerId as string;
    if (!employerId) {
      res.status(400).json({ error: 'employerId query parameter is required' });
      return;
    }
    const jobs = await jobPostingRepo.listByEmployer(employerId);
    res.json({ jobs });
  } catch (err) {
    console.error('Error listing job postings:', err);
    res.status(500).json({ error: 'Failed to list job postings' });
  }
});

// Employer: list workflows for employer (tenant provisioning, etc.) - MongoDB
app.get('/api/employer/workflows', async (req, res) => {
  try {
    const employerId = req.query.employerId as string;
    if (!employerId) {
      res.status(400).json({ error: 'employerId query parameter is required' });
      return;
    }
    const workflows = await workflowRepo.listByEmployerId(employerId);
    res.json({ workflows });
  } catch (err) {
    console.error('Error listing employer workflows:', err);
    res.status(500).json({ error: 'Failed to list workflows' });
  }
});

// Get recommendations based on transcript/presentation - MongoDB for config
app.post('/api/recommendations', async (req, res) => {
  try {
    const analysisConfig = await credentialAnalysisConfigRepo.get();
    const config = loadDemoConfig() as {
      personas: Array<{
        id: string;
        type: string;
        name: string;
        image?: string;
        logo?: string;
        jobPostings: Array<Record<string, unknown>>;
      }>;
    };
    const allJobs: Array<Record<string, unknown>> = [];
    for (const persona of config.personas || []) {
      if (persona.type === 'Employer' && persona.jobPostings) {
        for (const job of persona.jobPostings) {
          allJobs.push({
            ...job,
            employerId: persona.id,
            employerName: persona.name,
            employerImage: persona.image,
            employerLogo: persona.logo,
          });
        }
      }
    }
    const featured = allJobs.filter((j) => j.featured);
    let jobs = featured.length > 0 ? featured : allJobs.slice(0, 8);
    if (!analysisConfig.enabled) {
      jobs = allJobs.slice(0, 8);
    }
    res.json({ jobs });
  } catch (err) {
    console.error('Error getting recommendations:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Serve static frontend in production
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

async function start() {
  try {
    const config = loadDemoConfig() as { tenantRequests?: Array<Record<string, unknown>> };
    const demoReqs = (config.tenantRequests ?? []).map((r) => ({
      id: String(r.id ?? ''),
      tenantType: String(r.tenantType ?? 'Employer'),
      name: String(r.name ?? ''),
      email: String(r.email ?? ''),
      contactName: r.contactName as string | undefined,
      contactTitle: r.contactTitle as string | undefined,
      contactPhone: r.contactPhone as string | undefined,
      registrationId: r.registrationId as string | undefined,
      jurisdiction: r.jurisdiction as string | undefined,
      businessAddress: r.businessAddress as string | undefined,
      website: r.website as string | undefined,
      industry: r.industry as string | undefined,
      intendedUse: r.intendedUse as string | undefined,
      hiringVolume: r.hiringVolume as string | undefined,
      primaryIndustries: r.primaryIndustries as string | undefined,
      fundingSource: r.fundingSource as string | undefined,
      eligibilityOverview: r.eligibilityOverview as string | undefined,
      accreditation: r.accreditation as string | undefined,
      credentialTypes: r.credentialTypes as string | undefined,
      submittedAt: r.submittedAt as string | undefined,
    }));
    const toSeed = demoReqs.filter((r) => r.id && r.name && r.email);
    if (toSeed.length > 0) {
      const seeded = await tenantRequestRepo.seed(toSeed);
      console.log('Seeded', seeded, 'demo tenant requests to MongoDB');
    }
  } catch (err) {
    console.error('MongoDB seed failed:', err);
    // Continue - plugin might not be up yet; frontend can still load
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Marketplace server running at http://0.0.0.0:${PORT}`);
  });
}

start();
