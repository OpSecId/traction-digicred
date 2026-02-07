import 'dotenv/config';
import { randomBytes, randomUUID } from 'crypto';
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
import { buildMarketplaceProfileCredential } from './controllers/credentialIssuanceController';
import { marketplaceBaseUrl } from './config';
import { marketplaceIssuer } from './config';
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
  invitationRepo,
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

// Tenant login (approved reservations: email + API key)
app.post('/api/auth/tenant-login', async (req, res) => {
  try {
    const { email, apiKey } = req.body as { email?: string; apiKey?: string };
    if (!email || !apiKey) {
      res.status(400).json({ error: 'Email and API key are required' });
      return;
    }
    const tenant = await tenantRepo.findByEmailAndApiKey(email.trim(), apiKey.trim());
    if (!tenant) {
      res.status(401).json({ error: 'Invalid email or API key' });
      return;
    }
    const cred = tenant.credential as Record<string, unknown> | undefined;
    const subj = cred?.credentialSubject as Record<string, unknown> | undefined;
    const name = (subj?.name as string) ?? 'Tenant';
    res.json({
      employerId: tenant.id,
      employerName: name,
    });
  } catch (err) {
    console.error('Tenant login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Innkeeper login (validates against innkeeperLogins or adminLogins in config)
function handleInnkeeperLogin(req: import('express').Request, res: import('express').Response) {
  console.log('Innkeeper login request received');
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const config = loadDemoConfig() as {
      innkeeperLogins?: Array<{ email: string; password: string }>;
      adminLogins?: Array<{ email: string; password: string }>;
    };
    const logins = config.innkeeperLogins ?? config.adminLogins ?? [];
    if (logins.length === 0) {
      console.warn('Innkeeper login: no innkeeperLogins in config');
    }
    const match = logins.find(
      (l) => l.email.toLowerCase() === String(email).toLowerCase().trim() && l.password === password
    );
    if (!match) {
      console.warn('Innkeeper login failed: no match for', email);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    console.log('Innkeeper login success:', email);
    res.json({ success: true });
  } catch (err) {
    console.error('Innkeeper login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}
app.post('/api/auth/innkeeper-login', handleInnkeeperLogin);
app.post('/api/auth/admin-login', handleInnkeeperLogin); // backward compatibility

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

// Public: check reservation by ID (ReservationCredential lookup – no auth)
app.get('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await tenantRequestRepo.getById(id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    res.json(reservation);
  } catch (err) {
    console.error('Error fetching reservation:', err);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// Tenant requests - submit for review, list, approve/reject (MongoDB)
app.post('/api/tenant-requests', async (req, res) => {
  try {
    const body = req.body as TenantRequestInput;
    if (!body?.tenancyType || !body?.name || !body?.email) {
      res.status(400).json({ error: 'tenancyType, name, and email are required' });
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
    let apiKey: string | undefined;
    if (body.status === 'approved') {
      await workflowRepo.create(id, 'verify-tenant');
      const upd = updated as Record<string, unknown>;
      const cred = upd.credential as Record<string, unknown> | undefined;
      const subj = cred?.credentialSubject as Record<string, unknown> | undefined;
      const underName = subj?.underName as Record<string, unknown> | undefined;
      const reservationFor = subj?.reservationFor as Record<string, unknown> | undefined;
      const address = underName?.address as Record<string, unknown> | undefined;
      const credentialToStore = buildMarketplaceProfileCredential({
        id: String(underName?.id ?? upd.id ?? ''),
        name: String(underName?.name ?? ''),
        email: String(underName?.email ?? ''),
        tenancyType: String(reservationFor?.tenancyType ?? ''),
        industry: underName?.industry as string | undefined,
        website: underName?.url as string | undefined,
        businessAddress: address?.streetAddress as string | undefined,
      });
      // Provision tenant via plugin (creates sub-wallet), then save to MongoDB
      const tenant = await pluginDb.createTenant(id, { credential: credentialToStore });
      if (tenant) {
        await tenantRepo.saveFromPlugin({ ...tenant, credential: credentialToStore });
        apiKey = randomBytes(24).toString('base64url');
        await tenantRepo.setApiKey(String(tenant.id), apiKey);
        // Create employer_profiles for Employer tenants (profile credential created on approval, not first job)
        if (upd.tenancyType === 'Employer') {
          await employerProfileRepo.create(String(tenant.id), credentialToStore);
        }
      }
      console.log('Stored MarketplaceProfileCredential for', underName?.name ?? upd.name);
    }
    res.json({ ...updated, apiKey });
  } catch (err) {
    console.error('Error updating tenant request:', err);
    res.status(500).json({ error: 'Failed to update tenant request' });
  }
});

// Innkeeper: list tenants (provisioned sub-wallets) - MongoDB
app.get('/api/innkeeper/tenants', async (_req, res) => {
  try {
    const tenants = await tenantRepo.list();
    res.json({ tenants });
  } catch (err) {
    console.error('Error listing tenants:', err);
    res.status(500).json({ error: 'Failed to list tenants' });
  }
});

// Innkeeper: get tenant details (with request info and credential) - MongoDB
app.get('/api/innkeeper/tenants/:id', async (req, res) => {
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

// Innkeeper: revoke tenant access - MongoDB
app.post('/api/innkeeper/tenants/:id/revoke', async (req, res) => {
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

// Innkeeper: create tenant (out-of-band onboarding) - MongoDB
app.post('/api/innkeeper/tenants', async (req, res) => {
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

// Innkeeper: credential analysis workflow config - MongoDB
app.get('/api/innkeeper/credential-analysis', async (_req, res) => {
  try {
    const config = await credentialAnalysisConfigRepo.get();
    res.json(config);
  } catch (err) {
    console.error('Error loading credential analysis config:', err);
    res.status(500).json({ error: 'Failed to load credential analysis config' });
  }
});

app.put('/api/innkeeper/credential-analysis', async (req, res) => {
  try {
    const body = req.body as Partial<CredentialAnalysisConfig>;
    const config = await credentialAnalysisConfigRepo.update(body as Record<string, unknown>);
    res.json(config);
  } catch (err) {
    console.error('Error updating credential analysis config:', err);
    res.status(500).json({ error: 'Failed to update credential analysis config' });
  }
});

// Innkeeper: list trust registries (from config)
app.get('/api/innkeeper/trust-registries', (_req, res) => {
  try {
    const registry = loadTrustRegistry() as { registries?: unknown[] };
    res.json({ trustRegistries: registry.registries ?? [] });
  } catch (err) {
    console.error('Error loading trust registry:', err);
    res.status(500).json({ error: 'Failed to load trust registry' });
  }
});

// Innkeeper: list workflow instances - MongoDB
app.get('/api/innkeeper/workflows', async (_req, res) => {
  try {
    const workflows = await workflowRepo.list();
    res.json({ workflows });
  } catch (err) {
    console.error('Error listing workflows:', err);
    res.status(500).json({ error: 'Failed to list workflows' });
  }
});

// Innkeeper: create workflow instance (e.g. trigger tenant provisioning) - MongoDB
app.post('/api/innkeeper/workflows', async (req, res) => {
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

// Derive base URL from request (Origin/Referer) or config — so invitation links use the frontend's port
function getInvitationBaseUrl(req: express.Request): string {
  const origin = req.get('origin') || req.get('referer');
  if (origin) {
    try {
      const u = new URL(origin);
      return `${u.protocol}//${u.host}`.replace(/\/$/, '');
    } catch {
      /* ignore */
    }
  }
  return marketplaceBaseUrl.replace(/\/$/, '');
}

// Marketplace plugin: create OOB invitation (proxies to ACA-Py agent, stores in MongoDB for short URL)
app.post('/api/innkeeper/marketplace/invitation', async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const result = await marketplaceController.createInvitation(body);
    const fullUrl = result.invitation_url as string;
    const oobMatch = /[?&]oob=([^&]+)/.exec(fullUrl);
    const oobB64 = oobMatch ? oobMatch[1] : '';
    if (oobB64) {
      const oobId = result.oob_id as string | undefined;
      const doc = await invitationRepo.insert({
        oobB64,
        oobId,
        contentUrl: body.content_url as string | undefined,
        invitation: result.invitation as Record<string, unknown>,
      });
      const id = String((doc as { id?: string }).id ?? oobId ?? '');
      const base = getInvitationBaseUrl(req);
      result.invitation_url = `${base}/connect?_oobid=${encodeURIComponent(id)}`;
    }
    res.json(result);
  } catch (err) {
    console.error('Marketplace create invitation error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to create invitation';
    res.status(500).json({ error: msg });
  }
});

// OOB short URL redirect: /oob/:id -> /connect?_oobid={uuid}
app.get('/oob/:id', async (req, res) => {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) {
      res.status(400).json({ error: 'Missing invitation id' });
      return;
    }
    const doc = await invitationRepo.getById(id);
    if (!doc) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }
    const connectUrl = `${marketplaceBaseUrl.replace(/\/$/, '')}/connect?_oobid=${encodeURIComponent(id)}`;
    res.redirect(302, connectUrl);
  } catch (err) {
    console.error('OOB redirect error:', err);
    res.status(500).json({ error: 'Failed to resolve invitation' });
  }
});

// GET /connect?_oobid=xxx — return invitation as application/json (OOB deep link)
app.get('/connect', async (req, res, next) => {
  let oobid = typeof req.query._oobid === 'string' ? req.query._oobid.trim() : '';
  if (!oobid && req.url) {
    const match = /[?&]_oobid=([^&]+)/.exec(req.url);
    if (match) oobid = decodeURIComponent(match[1]).trim();
  }
  if (!oobid) {
    next();
    return;
  }
  try {
    const doc = await invitationRepo.getById(oobid);
    if (!doc?.oobB64) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.json({ oob: String(doc.oobB64), invitation: doc.invitation });
  } catch (err) {
    console.error('OOB connect resolve error:', err);
    res.status(500).json({ error: 'Failed to resolve invitation' });
  }
});

// Get latest invitation URL (public, for Join channel button) — didcomm://link?oob= format
app.get('/api/oob/active', async (req, res) => {
  try {
    const doc = await invitationRepo.getLatest();
    if (!doc?.oobB64) {
      res.json({ invitation_url: null });
      return;
    }
    const oobB64 = String(doc.oobB64);
    const invitationUrl = `didcomm://link?oob=${encodeURIComponent(oobB64)}`;
    res.json({ invitation_url: invitationUrl });
  } catch (err) {
    console.error('OOB active error:', err);
    res.json({ invitation_url: null });
  }
});

// Resolve OOB by _oobid: returns full invitation for /connect page to use
app.get('/api/oob/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await invitationRepo.getById(id);
    if (!doc?.oobB64) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }
    res.json({ oob: String(doc.oobB64), invitation: doc.invitation });
  } catch (err) {
    console.error('OOB resolve error:', err);
    res.status(500).json({ error: 'Failed to resolve invitation' });
  }
});

// Marketplace plugin: analyze transcript (proxies to ACA-Py agent)
app.post('/api/innkeeper/marketplace/analyze-transcript', async (req, res) => {
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
app.get('/api/innkeeper/marketplace/action-menu', (_req, res) => {
  try {
    const config = getActionMenuConfig();
    res.json(config);
  } catch (err) {
    console.error('Action menu config error:', err);
    res.status(500).json({ error: 'Failed to load action menu config' });
  }
});

app.put('/api/innkeeper/marketplace/action-menu', (req, res) => {
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

// JSON-LD context for marketplace credentials
app.get('/ns/marketplace/v1', (_req, res) => {
  const contextPath = path.join(__dirname, '../docs/schemas/marketplace-context.jsonld');
  if (!fs.existsSync(contextPath)) {
    res.status(404).json({ error: 'Context file not found' });
    return;
  }
  res.setHeader('Content-Type', 'application/ld+json');
  res.sendFile(contextPath);
});

// Serve static frontend in production
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback: serve index.html only for navigational requests (skip /assets, /img, etc.)
  app.get('*', (req, res, next) => {
    const p = req.path;
    if (p.startsWith('/assets/') || p.startsWith('/img/') || /\.(js|css|ico|png|svg|woff2?|json|webmanifest)$/i.test(p)) {
      res.status(404).end();
      return;
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

async function start() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Marketplace server running at http://0.0.0.0:${PORT}`);
  });
}

start();
