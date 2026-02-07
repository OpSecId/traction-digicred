/**
 * MongoDB repositories for marketplace data.
 * Replaces pluginDb for storage; plugin still used for tenant provisioning.
 */

import { randomBytes, randomUUID } from 'crypto';
import { buildReservationCredentialFromTenantRequest } from '../controllers/credentialIssuanceController';
import { getMongoDb } from '../db/mongodb';

const COLL = {
  reservations: 'reservations',
  tenants: 'tenants',
  workflow_instances: 'workflow_instances',
  employer_profiles: 'employer_profiles',
  job_postings: 'job_postings',
  credential_analysis_config: 'credential_analysis_config',
  invitations: 'invitations',
} as const;

function refId(): string {
  return `REQ-${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function now(): string {
  return new Date().toISOString();
}

/** Remove keys with null or undefined values from an object (shallow). */
function stripNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v != null) out[k] = v;
  }
  return out as Partial<T>;
}

/** Hydrate API response from stored doc (credential + workflow). Derive fields from credential. */
function hydrateFromDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const cred = doc.credential as Record<string, unknown> | undefined;
  if (!cred?.credentialSubject) return doc;
  const subj = cred.credentialSubject as Record<string, unknown>;
  const underName = subj.underName as Record<string, unknown> | undefined;
  const reservationFor = subj.reservationFor as Record<string, unknown> | undefined;
  const contactPoint = underName?.contactPoint as Record<string, unknown> | undefined;
  return {
    id: cred.id,
    referenceId: subj.reservationId,
    tenancyType: reservationFor?.tenancyType,
    name: underName?.name,
    email: underName?.email,
    contactName: contactPoint?.name,
    contactTitle: contactPoint?.jobTitle,
    contactPhone: contactPoint?.telephone,
    registrationId: underName?.registrationId,
    jurisdiction: underName?.jurisdiction,
    businessAddress: (underName?.address as Record<string, unknown>)?.streetAddress,
    website: underName?.url,
    industry: underName?.industry,
    intendedUse: underName?.intendedUse,
    status: doc.status,
    submittedAt: doc.submittedAt,
    reviewedAt: doc.reviewedAt,
    reviewedBy: doc.reviewedBy,
    rejectionReason: doc.rejectionReason,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    credential: cred,
  };
}

/** Find doc by credential id (credential.id, reservationId, or underName.id). */
function reservationIdQuery(id: string): Record<string, unknown> {
  return {
    $or: [
      { 'credential.id': id },
      { 'credential.credentialSubject.reservationId': id },
      { 'credential.credentialSubject.underName.id': id },
    ],
  };
}

// Tenant requests – store credential as source of truth, no duplicate fields, no nulls
export const tenantRequestRepo = {
  async create(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.reservations);
    const id = `urn:uuid:${randomUUID()}`;
    const referenceId = refId();
    const submittedAt = now();
    const credential = buildReservationCredentialFromTenantRequest({
      id,
      referenceId,
      tenancyType: String(input.tenancyType ?? 'Employer'),
      name: String(input.name ?? ''),
      email: String(input.email ?? ''),
      contactName: input.contactName != null ? String(input.contactName) : undefined,
      contactTitle: input.contactTitle != null ? String(input.contactTitle) : undefined,
      contactPhone: input.contactPhone != null ? String(input.contactPhone) : undefined,
      registrationId: input.registrationId != null ? String(input.registrationId) : undefined,
      jurisdiction: input.jurisdiction != null ? String(input.jurisdiction) : undefined,
      businessAddress: input.businessAddress != null ? String(input.businessAddress) : undefined,
      website: input.website != null ? String(input.website) : undefined,
      industry: input.industry != null ? String(input.industry) : undefined,
      intendedUse: input.intendedUse != null ? String(input.intendedUse) : undefined,
    });
    const doc = stripNulls({
      credential,
      status: 'pending',
      submittedAt,
      createdAt: now(),
      updatedAt: now(),
    });
    await col.insertOne(doc);
    return hydrateFromDoc({ ...doc, credential });
  },

  async list(): Promise<unknown[]> {
    const db = await getMongoDb();
    const col = db.collection(COLL.reservations);
    const cursor = col.find({}).sort({ submittedAt: -1 });
    const docs = await cursor.toArray();
    return docs.map((d) => hydrateFromDoc(d as Record<string, unknown>));
  },

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const db = await getMongoDb();
    const col = db.collection(COLL.reservations);
    const doc = await col.findOne(reservationIdQuery(id));
    return doc ? hydrateFromDoc(doc as Record<string, unknown>) : null;
  },

  async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    options?: { rejectionReason?: string; reviewedBy?: string }
  ): Promise<Record<string, unknown> | null> {
    const db = await getMongoDb();
    const col = db.collection(COLL.reservations);
    const existing = await col.findOne(reservationIdQuery(id)) as Record<string, unknown> | null;
    if (!existing) return null;
    const update = stripNulls({
      status,
      reviewedAt: now(),
      ...(options?.reviewedBy && { reviewedBy: options.reviewedBy }),
      ...(status === 'rejected' && options?.rejectionReason && { rejectionReason: options.rejectionReason }),
      updatedAt: now(),
    });
    const result = await col.findOneAndUpdate(
      reservationIdQuery(id),
      { $set: update },
      { returnDocument: 'after' }
    );
    return result ? hydrateFromDoc(result as Record<string, unknown>) : null;
  },

  async seed(requests: Array<Record<string, unknown>>): Promise<number> {
    const db = await getMongoDb();
    const col = db.collection(COLL.reservations);
    let seeded = 0;
    for (const r of requests) {
      const name = r.name != null ? String(r.name) : '';
      const email = r.email != null ? String(r.email) : '';
      if (!name || !email) continue;
      const id = `urn:uuid:${randomUUID()}`;
      const referenceId = refId();
      const submittedAt = (r.submittedAt as string) ?? now();
      const credential = buildReservationCredentialFromTenantRequest({
        id,
        referenceId,
        tenancyType: String(r.tenancyType ?? 'Employer'),
        name,
        email,
        contactName: r.contactName != null ? String(r.contactName) : undefined,
        contactTitle: r.contactTitle != null ? String(r.contactTitle) : undefined,
        contactPhone: r.contactPhone != null ? String(r.contactPhone) : undefined,
        registrationId: r.registrationId != null ? String(r.registrationId) : undefined,
        jurisdiction: r.jurisdiction != null ? String(r.jurisdiction) : undefined,
        businessAddress: r.businessAddress != null ? String(r.businessAddress) : undefined,
        website: r.website != null ? String(r.website) : undefined,
        industry: r.industry != null ? String(r.industry) : undefined,
        intendedUse: r.intendedUse != null ? String(r.intendedUse) : undefined,
      });
      const doc = stripNulls({
        credential,
        status: 'pending',
        submittedAt,
        createdAt: now(),
        updatedAt: now(),
      });
      const credId = (credential as Record<string, unknown>).id as string;
      if (await col.findOne(reservationIdQuery(credId))) continue;
      await col.insertOne(doc);
      seeded++;
    }
    return seeded;
  },
};

// Tenants
export const tenantRepo = {
  async list(): Promise<unknown[]> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenants);
    return col.find({}).toArray();
  },

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenants);
    const doc = await col.findOne({ id });
    return doc as Record<string, unknown> | null;
  },

  async create(data: {
    tenantRequestId: string;
    did?: string;
    walletId?: string;
    credential?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenants);
    const id = `urn:uuid:${randomUUID()}`;
    const doc = {
      id,
      tenantRequestId: data.tenantRequestId,
      did: data.did ?? null,
      walletId: data.walletId ?? null,
      credential: data.credential ?? null,
      status: 'active',
      createdAt: now(),
    };
    await col.insertOne(doc);
    return doc;
  },

  async createManual(options: {
    tenantRequestId?: string;
    did?: string;
    walletId?: string;
  }): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenants);
    const id = options.did ?? `urn:uuid:${randomUUID()}`;
    const doc = {
      id,
      tenantRequestId: options.tenantRequestId ?? null,
      did: options.did ?? null,
      walletId: options.walletId ?? null,
      credential: null,
      status: 'active',
      createdAt: now(),
    };
    await col.insertOne(doc);
    return doc;
  },

  async revoke(id: string): Promise<boolean> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenants);
    const result = await col.updateOne({ id }, { $set: { status: 'revoked', updatedAt: now() } });
    return result.modifiedCount > 0;
  },

  async setApiKey(tenantId: string, apiKey: string): Promise<void> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenants);
    await col.updateOne(
      { id: tenantId },
      { $set: { apiKey, updatedAt: now() } }
    );
  },

  async findByEmailAndApiKey(email: string, apiKey: string): Promise<Record<string, unknown> | null> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenants);
    const normalized = String(email).toLowerCase().trim();
    const emailRegex = new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const docs = await col
      .find({
        $or: [
          { 'credential.credentialSubject.email': emailRegex },
          { 'credential.credentialSubject.contactPoint.email': emailRegex },
        ],
        apiKey,
        status: { $ne: 'revoked' },
      })
      .limit(1)
      .toArray();
    return docs.length ? (docs[0] as Record<string, unknown>) : null;
  },

  /** Save tenant from plugin provisioning response (handles snake_case or camelCase) */
  async saveFromPlugin(tenant: Record<string, unknown>): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenants);
    const id = String(
      tenant.id ?? tenant.wallet_id ?? tenant.walletId ?? `urn:uuid:${randomUUID()}`
    );
    const doc = {
      id,
      tenantRequestId: tenant.tenantRequestId ?? tenant.tenant_request_id ?? null,
      did: tenant.did ?? null,
      walletId: tenant.walletId ?? tenant.wallet_id ?? null,
      credential: tenant.credential ?? null,
      status: tenant.status ?? 'active',
      createdAt: tenant.createdAt ?? tenant.created_at ?? now(),
    };
    await col.replaceOne({ id }, doc, { upsert: true });
    return doc;
  },
};

// Workflows
export const workflowRepo = {
  async list(): Promise<unknown[]> {
    const db = await getMongoDb();
    const col = db.collection(COLL.workflow_instances);
    return col.find({}).sort({ startedAt: -1 }).toArray();
  },

  async listByEmployerId(employerId: string): Promise<unknown[]> {
    const tenant = await tenantRepo.getById(employerId);
    const tenantRequestId = (tenant?.tenantRequestId ?? employerId) as string;
    const db = await getMongoDb();
    const col = db.collection(COLL.workflow_instances);
    return col.find({ tenantRequestId }).sort({ startedAt: -1 }).toArray();
  },

  async create(tenantRequestId: string, workflowType: string): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.workflow_instances);
    const id = `urn:uuid:${randomUUID()}`;
    const startedAt = now();
    const doc = {
      id,
      tenantRequestId,
      workflowType,
      status: 'running',
      currentStep: null,
      payload: null,
      startedAt,
      completedAt: null,
      errorMessage: null,
    };
    await col.insertOne(doc);
    return doc;
  },
};

// Employer profiles
export const employerProfileRepo = {
  async get(employerId: string): Promise<Record<string, unknown> | null> {
    const db = await getMongoDb();
    const col = db.collection(COLL.employer_profiles);
    const doc = await col.findOne({ employerId });
    return doc as Record<string, unknown> | null;
  },

  async create(employerId: string, credential: Record<string, unknown>): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.employer_profiles);
    const nowStr = now();
    const doc = {
      employerId,
      credential,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    await col.insertOne(doc);
    return doc;
  },

  async ensure(employerId: string, credential: Record<string, unknown>): Promise<Record<string, unknown>> {
    const existing = await this.get(employerId);
    if (existing) return existing;
    return this.create(employerId, credential);
  },
};

// Job postings
export const jobPostingRepo = {
  async listByEmployer(employerId: string): Promise<unknown[]> {
    const db = await getMongoDb();
    const col = db.collection(COLL.job_postings);
    return col.find({ employerId }).sort({ datePosted: -1 }).toArray();
  },

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const db = await getMongoDb();
    const col = db.collection(COLL.job_postings);
    const doc = await col.findOne({ id });
    return doc as Record<string, unknown> | null;
  },

  async create(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.job_postings);
    const id = (data.id as string) ?? `urn:uuid:${randomUUID()}`;
    const nowStr = now();
    const doc = {
      id,
      employerId: data.employerId,
      title: data.title,
      description: data.description,
      datePosted: data.datePosted ?? nowStr,
      validThrough: data.validThrough ?? null,
      employmentType: data.employmentType ?? null,
      locationCity: data.locationCity ?? null,
      locationRegion: data.locationRegion ?? null,
      locationCountry: data.locationCountry ?? 'US',
      locationType: data.locationType ?? null,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      salaryCurrency: data.salaryCurrency ?? null,
      salaryDisplay: data.salaryDisplay ?? null,
      skills: data.skills ?? null,
      qualifications: data.qualifications ?? null,
      benefits: data.benefits ?? null,
      industry: data.industry ?? null,
      credential: data.credential ?? null,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    await col.insertOne(doc);
    return doc;
  },
};

// OOB invitations (short URL storage; id is oob_id UUID)
export const invitationRepo = {
  async insert(data: {
    oobB64: string;
    oobId?: string;
    contentUrl?: string;
    invitation?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.invitations);
    const id = data.oobId ?? randomBytes(6).toString('base64url');
    const doc = {
      id,
      oobB64: data.oobB64,
      oobId: data.oobId ?? null,
      contentUrl: data.contentUrl ?? null,
      invitation: data.invitation ?? null,
      createdAt: now(),
    };
    await col.insertOne(doc);
    return doc;
  },

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const db = await getMongoDb();
    const col = db.collection(COLL.invitations);
    const doc = await col.findOne({ id });
    return doc as Record<string, unknown> | null;
  },

  async getLatest(): Promise<Record<string, unknown> | null> {
    const db = await getMongoDb();
    const col = db.collection(COLL.invitations);
    const doc = await col.findOne(
      {},
      { sort: { createdAt: -1 } }
    );
    return doc as Record<string, unknown> | null;
  },
};

// Credential analysis config
export const credentialAnalysisConfigRepo = {
  async get(): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.credential_analysis_config);
    const doc = (await col.findOne({ id: 'default' })) as { config?: string } | null;
    if (!doc?.config) return { enabled: false };
    try {
      return JSON.parse(doc.config) as Record<string, unknown>;
    } catch {
      return { enabled: false };
    }
  },

  async update(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.credential_analysis_config);
    const nowStr = now();
    const doc = {
      id: 'default',
      config: JSON.stringify(config),
      updatedAt: nowStr,
      updatedBy: null,
    };
    await col.replaceOne({ id: 'default' }, doc, { upsert: true });
    return config;
  },
};
