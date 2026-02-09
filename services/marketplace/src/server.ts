import 'dotenv/config';
import { randomBytes, randomUUID } from 'crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { adminController } from './controllers/adminController';
import { tenancyController } from './controllers/tenancyController';
import type { CredentialAnalysisConfig } from './types';
import { marketplaceController } from './controllers/marketplaceController';
import {
  getActionMenuConfig,
  updateActionMenuConfig,
} from './controllers/actionMenuController';
import { buildMarketplaceProfileCredential } from './controllers/credentialIssuanceController';
import { marketplaceBaseUrl, marketplaceIssuer, tenantDidWeb, tenantDidWebForShortId } from './config';
import { buildJobPostingCredential } from './controllers/jobPostingController';
import { buildEmployerProfileCredential } from './controllers/employerProfileController';
import { createTenant as pluginCreateTenant } from './controllers/pluginDbController';
import { asyncHandler } from './utils/asyncHandler';
import { parseJobBody } from './utils/jobBody';
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
import {
  createSession,
  getSession,
  destroySession,
  createInnkeeperSession,
  getInnkeeperSession,
  destroyInnkeeperSession,
  SESSION_COOKIE,
  INNKEEPER_COOKIE,
  isSessionEnabled,
} from './sessionStore';

const app = express();
const PORT = Number(process.env.PORT) || 5174;

// Trust proxy when behind reverse proxy (Railway, nginx, etc.) so X-Forwarded-For is used correctly
app.set('trust proxy', 1);

/** Normalize route param to string (Express can type as string | string[]). */
function param(req: express.Request, name: string): string {
  const v = req.params[name];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

/** Normalize query param to string. */
function query(req: express.Request, name: string): string {
  const v = req.query[name];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return '';
}

// CORS: set CORS_ORIGIN env (comma-separated) to restrict origins in production
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  })
);
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled; enable and configure for production
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per window per IP
  message: { error: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 submissions per 15 min
  message: { error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const ADDITIONS_PATH = 'config/trust-registry-additions.json';

/** Simple email format validation */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_STRING = 500;
const VALID_TENANCY_TYPES = ['Employer', 'Scholarship Admin', 'Education Institution', 'Government Service'];

function validateTenantRequest(body: Record<string, unknown>): string | null {
  if (!body?.tenancyType || typeof body.tenancyType !== 'string' || !body.tenancyType.trim()) {
    return 'tenancyType is required';
  }
  if (!VALID_TENANCY_TYPES.includes(body.tenancyType.trim())) {
    return 'tenancyType must be one of: ' + VALID_TENANCY_TYPES.join(', ');
  }
  if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
    return 'name is required';
  }
  if (body.name.length > MAX_STRING) return 'name is too long';
  if (!body?.email || typeof body.email !== 'string' || !body.email.trim()) {
    return 'email is required';
  }
  if (!EMAIL_REGEX.test(body.email.trim())) return 'email format is invalid';
  if (body.email.length > 254) return 'email is too long';
  const strFields: Array<[string, number]> = [
    ['contactName', 200], ['contactTitle', 200], ['contactPhone', 50], ['registrationId', 100],
    ['jurisdiction', 200], ['businessAddress', 500], ['website', 500], ['industry', 200], ['intendedUse', 2000],
  ];
  for (const [f, max] of strFields) {
    const v = body[f];
    if (v != null && typeof v === 'string' && v.length > max) {
      return `${f} is too long`;
    }
  }
  if (body.website != null && typeof body.website === 'string' && body.website.trim()) {
    try {
      const u = new URL(body.website.trim());
      if (!['http:', 'https:'].includes(u.protocol)) return 'website must use http or https';
    } catch {
      return 'website must be a valid URL';
    }
  }
  return null;
}

function getAdditionsPath(): string {
  return path.join(process.cwd(), ADDITIONS_PATH);
}

function loadTrustRegistryAdditions(): unknown[] {
  const p = getAdditionsPath();
  try {
    if (fs.existsSync(p)) {
      const contents = fs.readFileSync(p, 'utf8');
      const data = JSON.parse(contents) as { additions?: unknown[] };
      return data.additions ?? [];
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveTrustRegistryAdditions(additions: unknown[]): void {
  const p = getAdditionsPath();
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(p, JSON.stringify({ additions }, null, 2), 'utf8');
}

function loadTrustRegistry(): unknown {
  const additions = loadTrustRegistryAdditions();
  return { registries: additions };
}

// Agent status (for health checks / ops)
app.get('/api/agents/admin/status', asyncHandler(async (_req, res) => {
  res.json(await adminController.status());
}));
app.get('/api/agents/tenancy/status', asyncHandler(async (_req, res) => {
  res.json(await tenancyController.status());
}));
app.get('/api/mongo/status', asyncHandler(async (_req, res) => {
  const db = await getMongoDb();
  await db.command({ ping: 1 });
  res.json({ ok: true, database: db.databaseName });
}));

// Employer login: removed - use /api/auth/tenant-login with email + API key for employer tenants

// Tenant login (approved reservations: email + API key)
app.post('/api/auth/tenant-login', authLimiter, async (req, res) => {
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
    const employerId = String(tenant.id ?? '');
    const employerName = name;

    if (isSessionEnabled()) {
      const sessionId = await createSession({ employerId, employerName });
      const isSecure = process.env.NODE_ENV === 'production';
      res.cookie(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    res.json({
      employerId,
      employerName,
    });
  } catch (err) {
    console.error('Tenant login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Tenant session (restore session on page load)
app.get('/api/auth/tenant-session', asyncHandler(async (req, res) => {
  if (!isSessionEnabled()) {
    res.json({ employerId: null, employerName: null });
    return;
  }
  const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!sessionId || typeof sessionId !== 'string') {
    res.json({ employerId: null, employerName: null });
    return;
  }
  const session = await getSession(sessionId);
  if (!session) {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ employerId: null, employerName: null });
    return;
  }
  res.json({
    employerId: session.employerId,
    employerName: session.employerName,
  });
}));

// Tenant logout
app.post('/api/auth/tenant-logout', asyncHandler(async (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (sessionId && typeof sessionId === 'string') {
    await destroySession(sessionId);
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ success: true });
}));

// Innkeeper login (validates against INNKEEPER_EMAIL, INNKEEPER_PASSWORD env vars)
async function handleInnkeeperLogin(req: import('express').Request, res: import('express').Response) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const envEmail = process.env.INNKEEPER_EMAIL;
    const envPassword = process.env.INNKEEPER_PASSWORD;
    if (!envEmail || !envPassword) {
      res.status(503).json({ error: 'Innkeeper login not configured. Set INNKEEPER_EMAIL and INNKEEPER_PASSWORD.' });
      return;
    }
    if (email.toLowerCase().trim() !== envEmail.toLowerCase() || password !== envPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    if (isSessionEnabled()) {
      const sessionId = await createInnkeeperSession();
      const isSecure = process.env.NODE_ENV === 'production';
      res.cookie(INNKEEPER_COOKIE, sessionId, {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Innkeeper login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}
app.post('/api/auth/innkeeper-login', authLimiter, handleInnkeeperLogin);

// Innkeeper session (restore session on page load)
app.get('/api/auth/innkeeper-session', asyncHandler(async (req, res) => {
  if (!isSessionEnabled()) {
    res.json({ isAdmin: false });
    return;
  }
  const sessionId = req.cookies?.[INNKEEPER_COOKIE] as string | undefined;
  if (!sessionId || typeof sessionId !== 'string') {
    res.json({ isAdmin: false });
    return;
  }
  const session = await getInnkeeperSession(sessionId);
  if (!session) {
    res.clearCookie(INNKEEPER_COOKIE, { path: '/' });
    res.json({ isAdmin: false });
    return;
  }
  res.json({ isAdmin: true });
}));

// Innkeeper logout
app.post('/api/auth/innkeeper-logout', asyncHandler(async (req, res) => {
  const sessionId = req.cookies?.[INNKEEPER_COOKIE] as string | undefined;
  if (sessionId && typeof sessionId === 'string') {
    await destroyInnkeeperSession(sessionId);
  }
  res.clearCookie(INNKEEPER_COOKIE, { path: '/' });
  res.json({ success: true });
}));
app.post('/api/auth/admin-login', authLimiter, handleInnkeeperLogin); // backward compatibility

// Get credentials for presentation request (empty - holders use wallet credentials)
app.get('/api/presentation-request/credentials', (_req, res) => {
  res.json({ credentials: [] });
});

app.get('/api/reservations/:id', asyncHandler(async (req, res) => {
  const reservation = await tenantRequestRepo.getById(param(req, 'id'));
  if (!reservation) res.status(404).json({ error: 'Reservation not found' });
  else res.json(reservation);
}));

// Tenant requests - submit for review, list, approve/reject (MongoDB)
app.post('/api/tenant-requests', formLimiter, asyncHandler(async (req, res) => {
  const err = validateTenantRequest(req.body as Record<string, unknown>);
  if (err) {
    res.status(400).json({ error: err });
    return;
  }
  res.status(201).json(await tenantRequestRepo.create(req.body as Record<string, unknown>));
}));
app.get('/api/tenant-requests', asyncHandler(async (_req, res) => {
  res.json({ requests: await tenantRequestRepo.list() });
}));

app.patch('/api/tenant-requests/:id', asyncHandler(async (req, res) => {
  const id = param(req, 'id');
  const body = req.body as { status?: 'approved' | 'rejected'; rejectionReason?: string };
  if (!body?.status || !['approved', 'rejected'].includes(body.status)) {
    res.status(400).json({ error: 'status must be "approved" or "rejected"' });
    return;
  }
  const updated = await tenantRequestRepo.updateStatus(id, body.status, { rejectionReason: body.rejectionReason });
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
    const shortId = randomBytes(6).toString('base64url');
    const tenantSubjectId = tenantDidWebForShortId(shortId);
    const credentialToStore = buildMarketplaceProfileCredential({
      id: String(underName?.id ?? upd.id ?? ''),
      subjectId: tenantSubjectId,
      name: String(underName?.name ?? ''),
      email: String(underName?.email ?? ''),
      tenancyType: String(reservationFor?.tenancyType ?? ''),
      industry: underName?.industry as string | undefined,
      website: underName?.url as string | undefined,
      businessAddress: address?.streetAddress as string | undefined,
    });
    const tenant = await pluginCreateTenant(id, { credential: credentialToStore });
    if (tenant) {
      await tenantRepo.saveFromPlugin({ ...tenant, credential: credentialToStore }, shortId);
      apiKey = randomBytes(24).toString('base64url');
      await tenantRepo.setApiKey(String(tenant.id), apiKey);
      if (upd.tenancyType === 'Employer') {
        await employerProfileRepo.create(String(tenant.id), credentialToStore);
      }
    }
    console.log('Stored MarketplaceProfileCredential for', underName?.name ?? upd.name);
  }
  res.json({ ...updated, apiKey });
}));

// Innkeeper: settings (agent + marketplace config)
app.get('/api/innkeeper/settings', asyncHandler(async (_req, res) => {
  res.json(await adminController.getSettings());
}));

// Innkeeper: tenants - MongoDB
app.get('/api/innkeeper/tenants', asyncHandler(async (_req, res) => {
  res.json({ tenants: await tenantRepo.list() });
}));
app.get('/api/innkeeper/tenants/:id', asyncHandler(async (req, res) => {
  const tenant = await tenantRepo.getById(param(req, 'id'));
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  const tenantRequest = tenant.tenantRequestId ? await tenantRequestRepo.getById(tenant.tenantRequestId as string) : null;
  res.json({ tenant, tenantRequest });
}));
app.post('/api/innkeeper/tenants/:id/revoke', asyncHandler(async (req, res) => {
  const ok = await tenantRepo.revoke(param(req, 'id'));
  if (!ok) res.status(404).json({ error: 'Tenant not found' });
  else res.json({ revoked: true });
}));
app.post('/api/innkeeper/tenants', asyncHandler(async (req, res) => {
  const b = req.body as { tenantRequestId?: string; did?: string; walletId?: string };
  const tenant = await tenantRepo.createManual({
    tenantRequestId: b.tenantRequestId?.trim() || undefined,
    did: b.did?.trim() || undefined,
    walletId: b.walletId?.trim() || undefined,
  });
  res.status(201).json(tenant);
}));
app.get('/api/innkeeper/credential-analysis', asyncHandler(async (_req, res) => {
  res.json(await credentialAnalysisConfigRepo.get());
}));
app.put('/api/innkeeper/credential-analysis', asyncHandler(async (req, res) => {
  res.json(await credentialAnalysisConfigRepo.update(req.body as Record<string, unknown>));
}));

// Innkeeper: list trust registries (from config + additions)
app.get('/api/innkeeper/trust-registries', (_req, res) => {
  try {
    const registry = loadTrustRegistry() as { registries?: unknown[] };
    res.json({ trustRegistries: registry.registries ?? [] });
  } catch (err) {
    console.error('Error loading trust registry:', err);
    res.status(500).json({ error: 'Failed to load trust registry' });
  }
});

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

// Innkeeper: add trust registry entry (saved to config/trust-registry-additions.json)
app.post('/api/innkeeper/trust-registries', (req, res) => {
  try {
    const body = req.body as { name?: string; type?: string; did?: string; credentialTypes?: string[]; logo?: string; website?: string };
    if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const did = body.did && typeof body.did === 'string' ? body.did.trim() : '';
    if (!did) {
      res.status(400).json({ error: 'did is required' });
      return;
    }
    const logo = body.logo && typeof body.logo === 'string' ? body.logo.trim() : '';
    if (logo && !isValidUrl(logo)) {
      res.status(400).json({ error: 'logo must be a valid http or https URL' });
      return;
    }
    const website = body.website && typeof body.website === 'string' ? body.website.trim() : '';
    if (website && !isValidUrl(website)) {
      res.status(400).json({ error: 'website must be a valid http or https URL' });
      return;
    }
    const type = (body.type && typeof body.type === 'string' ? body.type.trim() : 'EducationInstitution') || 'EducationInstitution';
    const credentialTypes = Array.isArray(body.credentialTypes) ? body.credentialTypes : [];
    const entry = {
      id: did,
      name: body.name.trim(),
      type,
      did,
      ...(credentialTypes.length ? { credentialTypes } : {}),
      ...(logo ? { logo } : {}),
      ...(website ? { website } : {}),
    };
    const additions = loadTrustRegistryAdditions();
    additions.push(entry);
    saveTrustRegistryAdditions(additions);
    res.status(201).json(entry);
  } catch (err) {
    console.error('Error adding trust registry entry:', err);
    res.status(500).json({ error: 'Failed to add trust registry entry' });
  }
});

app.get('/api/innkeeper/workflows', asyncHandler(async (_req, res) => {
  res.json({ workflows: await workflowRepo.list() });
}));
app.post('/api/innkeeper/workflows', asyncHandler(async (req, res) => {
  const { tenantRequestId, workflowType } = req.body as { tenantRequestId?: string; workflowType?: string };
  if (!tenantRequestId || !workflowType) {
    res.status(400).json({ error: 'tenantRequestId and workflowType are required' });
    return;
  }
  res.status(201).json(await workflowRepo.create(tenantRequestId, workflowType));
}));

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

// Get latest invitation URL (public) — didcomm for click, qr_url (https) for QR
app.get('/api/oob/active', async (req, res) => {
  try {
    const doc = await invitationRepo.getLatest();
    if (!doc?.oobB64) {
      res.json({ invitation_url: null, qr_url: null });
      return;
    }
    const oobB64 = String(doc.oobB64);
    const invitationUrl = `didcomm://link?oob=${encodeURIComponent(oobB64)}`;
    const base = getInvitationBaseUrl(req);
    const id = (doc as { id?: string }).id;
    const qrUrl = id ? `${base}/connect?_oobid=${encodeURIComponent(id)}` : `${base}/connect?oob=${encodeURIComponent(oobB64)}`;
    res.json({ invitation_url: invitationUrl, qr_url: qrUrl });
  } catch (err) {
    console.error('OOB active error:', err);
    res.json({ invitation_url: null, qr_url: null });
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

// Transcript skills analysis (proxies to transcript-skills-analysis lambda via API Gateway)
const TRANSCRIPT_SKILLS_ANALYSIS_URL = process.env.TRANSCRIPT_SKILLS_ANALYSIS_URL;
app.post('/api/innkeeper/transcript-skills-analysis', async (req, res) => {
  try {
    const body = req.body as { coursesList?: Array<[string, string]> };
    if (!body?.coursesList || !Array.isArray(body.coursesList)) {
      res.status(400).json({ error: 'coursesList is required and must be an array of [title, code] pairs' });
      return;
    }
    if (!TRANSCRIPT_SKILLS_ANALYSIS_URL) {
      // Demo response for development when lambda URL is not configured
      const courseIds = body.coursesList.map(([, code]) => code);
      const mockResponse = {
        count: String(Math.min(courseIds.length * 2, 6)),
        skills_of_interest: [
          { name: 'Critical Thinking', category: 'Cognitive', pathways: 'Consider majors in philosophy, law, or data science. Pursue certifications in logical reasoning.', count: 2, max_skill_level: 2 },
          { name: 'Written Communication', category: 'Communication', pathways: 'Explore English, journalism, or marketing. Develop skills through professional writing courses.', count: 2, max_skill_level: 3 },
          { name: 'Research', category: 'Academic', pathways: 'Pursue graduate studies or roles in libraries and think tanks. Build experience through internships.', count: 1, max_skill_level: 2 },
        ],
        skill_level_counts: [1, 2, 1],
        summary: 'Your transcript reflects strong analytical and communication skills. These competencies will support your goals in further education and career.',
        course_ids: courseIds,
      };
      res.json(mockResponse);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const proxyRes = await fetch(TRANSCRIPT_SKILLS_ANALYSIS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coursesList: body.coursesList }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = (await proxyRes.json()) as { status?: number; body?: unknown; statusCode?: number } | unknown;
    if (!proxyRes.ok) {
      const errBody = typeof data === 'object' && data && 'body' in data
        ? (data as { body: unknown }).body
        : data;
      const errPayload = typeof errBody === 'string' ? (() => { try { return JSON.parse(errBody); } catch { return { error: errBody }; } })() : errBody;
      res.status(proxyRes.status).json(errPayload);
      return;
    }
    const rawBody = typeof data === 'object' && data && 'body' in data ? (data as { body: unknown }).body : data;
    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) as Record<string, unknown> : rawBody;
    res.json(payload);
  } catch (err) {
    console.error('Transcript skills analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze transcript skills' });
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
app.post('/api/employer/jobs', asyncHandler(async (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (!body?.employerId || !body?.employerName || !body?.title || !body?.description) {
    res.status(400).json({ error: 'employerId, employerName, title, and description are required' });
    return;
  }
  const input = parseJobBody(body);
  const tenant = await tenantRepo.getById(input.employerId);
  const shortId = tenant?.shortId as string | undefined;
  const tenantSubjectId = shortId ? tenantDidWebForShortId(shortId) : undefined;
  const profileCred = buildEmployerProfileCredential({
    ...input,
    website: input.employerWebsite,
    industry: input.employerIndustry,
    subjectId: tenantSubjectId,
  });
  await employerProfileRepo.ensure(input.employerId, profileCred);
  const profile = await employerProfileRepo.get(input.employerId);
  const cred = profile?.credential as { credentialSubject?: { name?: string; image?: string; url?: string } } | undefined;
  const subj = cred?.credentialSubject ?? {};
  const employerWebsite = input.employerWebsite ?? subj.url;
  const inputWithWebsite = { ...input, employerWebsite };
  const issuer = {
    id: (tenant?.did as string) ?? tenantDidWeb(input.employerId),
    name: input.employerName,
    description: input.employerIndustry
      ? `${input.employerName} – ${input.employerIndustry}`
      : undefined,
    image: (subj.image as string) ?? undefined,
  };
  const jobId = `urn:uuid:${randomUUID()}`;
  const credential = buildJobPostingCredential(jobId, inputWithWebsite, issuer);
  const job = await jobPostingRepo.create({
    id: jobId,
    employerId: input.employerId,
    employerName: input.employerName,
    title: input.title.trim(),
    description: input.description.trim(),
    employerEmail: input.employerEmail,
    employerIndustry: input.employerIndustry,
    employerWebsite: input.employerWebsite,
    employmentType: input.employmentType,
    locationCity: input.locationCity,
    locationRegion: input.locationRegion,
    locationCountry: input.locationCountry,
    locationType: input.locationType,
    salaryMin: input.salaryMin,
    salaryMax: input.salaryMax,
    salaryCurrency: input.salaryCurrency,
    salaryDisplay: input.salaryDisplay,
    skills: input.skills,
    qualifications: input.qualifications,
    benefits: input.benefits,
    industry: input.industry,
    validThrough: input.validThrough,
    credential,
  });
  res.status(201).json(job);
}));

app.get('/api/jobs/:id', asyncHandler(async (req, res) => {
  const job = await jobPostingRepo.getById(param(req, 'id'));
  if (!job) res.status(404).json({ error: 'Job posting not found' });
  else res.json(job);
}));
app.get('/api/employer/profile', asyncHandler(async (req, res) => {
  const employerId = query(req, 'employerId');
  if (!employerId) {
    res.status(400).json({ error: 'employerId query parameter is required' });
    return;
  }
  const profile = await employerProfileRepo.get(employerId);
  res.json(profile ?? { employerId, credential: null });
}));
app.get('/api/employer/jobs', asyncHandler(async (req, res) => {
  const employerId = query(req, 'employerId');
  if (!employerId) {
    res.status(400).json({ error: 'employerId query parameter is required' });
    return;
  }
  res.json({ jobs: await jobPostingRepo.listByEmployer(employerId) });
}));
app.patch('/api/employer/jobs', asyncHandler(async (req, res) => {
  const jobId = query(req, 'id');
  const employerId = query(req, 'employerId');
  if (!jobId || !employerId) {
    res.status(400).json({ error: 'id and employerId query parameters are required' });
    return;
  }
  const job = await jobPostingRepo.getById(jobId);
  if (!job) {
    res.status(404).json({ error: 'Job posting not found' });
    return;
  }
  if ((job.employerId as string) !== employerId) {
    res.status(403).json({ error: 'Not authorized to update this job' });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const patch: { visibility?: boolean; status?: string } = {};
  if (typeof body.visibility === 'boolean') patch.visibility = body.visibility;
  if (typeof body.status === 'string' && (body.status === 'active' || body.status === 'revoked')) patch.status = body.status;
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: 'No valid update fields (visibility or status)' });
    return;
  }
  const updated = await jobPostingRepo.update(jobId, patch);
  res.json(updated);
}));
app.get('/api/employer/workflows', asyncHandler(async (req, res) => {
  const employerId = query(req, 'employerId');
  if (!employerId) {
    res.status(400).json({ error: 'employerId query parameter is required' });
    return;
  }
  res.json({ workflows: await workflowRepo.listByEmployerId(employerId) });
}));
app.get('/api/jobs', asyncHandler(async (_req, res) => {
  res.json({ jobs: await jobPostingRepo.listAll() });
}));
app.post('/api/recommendations', asyncHandler(async (_req, res) => {
  const jobs = (await jobPostingRepo.listAll()).slice(0, 8);
  res.json({ jobs });
}));

// DID documents (did:web resolution)
app.get('/.well-known/did.json', (_req, res) => {
  const base = marketplaceBaseUrl.replace(/\/$/, '');
  const didDoc = {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: marketplaceIssuer.id,
    service: [
      {
        id: `${marketplaceIssuer.id}#marketplace`,
        type: 'LinkedDomains',
        serviceEndpoint: { origins: [base] },
      },
    ],
  };
  res.setHeader('Content-Type', 'application/did+json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(didDoc);
});

app.get('/tenants/:shortId/did.json', asyncHandler(async (req, res) => {
  const shortId = param(req, 'shortId');
  const tenant = await tenantRepo.getByShortId(shortId);
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  const tenantDid = tenantDidWebForShortId(shortId);
  const base = marketplaceBaseUrl.replace(/\/$/, '');
  const cred = tenant.credential as Record<string, unknown> | undefined;
  const subj = cred?.credentialSubject as Record<string, unknown> | undefined;
  const didDoc: Record<string, unknown> = {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: tenantDid,
    service: [
      {
        id: `${tenantDid}#marketplace`,
        type: 'LinkedDomains',
        serviceEndpoint: { origins: [base] },
      },
    ],
  };
  if (subj?.url || subj?.website) didDoc.alsoKnownAs = subj.url ?? subj.website;
  res.setHeader('Content-Type', 'application/did+json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(didDoc);
}));

// JSON-LD context for marketplace credentials
app.get('/ns/marketplace/v1', (_req, res) => {
  // Prefer bundled path (dist/context/) — works when only dist/ is deployed
  const bundledPath = path.join(__dirname, 'context/marketplace-context.jsonld');
  const fallbackPath = path.join(__dirname, '../docs/schemas/marketplace-context.jsonld');
  const contextPath = fs.existsSync(bundledPath) ? bundledPath : fallbackPath;
  if (!fs.existsSync(contextPath)) {
    console.error('Marketplace context not found at', bundledPath, 'or', fallbackPath);
    res.status(404).json({ error: 'Context file not found' });
    return;
  }
  res.setHeader('Content-Type', 'application/ld+json');
  res.setHeader('Access-Control-Allow-Origin', '*');
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

// Global error handler (for asyncHandler and unhandled rejections)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Marketplace server running at http://0.0.0.0:${PORT}`);
});
