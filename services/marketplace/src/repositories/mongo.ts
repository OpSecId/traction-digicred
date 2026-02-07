/**
 * MongoDB repositories for marketplace data.
 * Replaces pluginDb for storage; plugin still used for tenant provisioning.
 */

import { randomUUID } from 'crypto';
import { getMongoDb } from '../db/mongodb';

const COLL = {
  tenant_requests: 'tenant_requests',
  tenants: 'tenants',
  workflow_instances: 'workflow_instances',
  employer_profiles: 'employer_profiles',
  job_postings: 'job_postings',
  credential_analysis_config: 'credential_analysis_config',
} as const;

function refId(): string {
  return `REQ-${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function now(): string {
  return new Date().toISOString();
}

// Tenant requests
export const tenantRequestRepo = {
  async create(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenant_requests);
    const id = `urn:uuid:${randomUUID()}`;
    const submittedAt = now();
    const doc = {
      id,
      referenceId: refId(),
      tenantType: input.tenantType,
      name: input.name,
      email: input.email,
      contactName: input.contactName ?? null,
      contactTitle: input.contactTitle ?? null,
      contactPhone: input.contactPhone ?? null,
      companyName: input.companyName ?? input.name ?? null,
      registrationId: input.registrationId ?? null,
      jurisdiction: input.jurisdiction ?? null,
      businessAddress: input.businessAddress ?? null,
      website: input.website ?? null,
      industry: input.industry ?? null,
      intendedUse: input.intendedUse ?? null,
      hiringVolume: input.hiringVolume ?? null,
      primaryIndustries: input.primaryIndustries ?? null,
      fundingSource: input.fundingSource ?? null,
      eligibilityOverview: input.eligibilityOverview ?? null,
      accreditation: input.accreditation ?? null,
      credentialTypes: input.credentialTypes ?? null,
      status: 'pending',
      submittedAt,
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      notes: null,
      createdAt: now(),
      updatedAt: now(),
    };
    await col.insertOne(doc);
    return doc;
  },

  async list(): Promise<unknown[]> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenant_requests);
    const cursor = col.find({}).sort({ submittedAt: -1 });
    return cursor.toArray();
  },

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenant_requests);
    const doc = await col.findOne({ id });
    return doc as Record<string, unknown> | null;
  },

  async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    options?: { rejectionReason?: string; reviewedBy?: string }
  ): Promise<Record<string, unknown> | null> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenant_requests);
    const reviewedAt = now();
    const update: Record<string, unknown> = {
      status,
      reviewedAt,
      reviewedBy: options?.reviewedBy ?? null,
      updatedAt: now(),
    };
    if (status === 'rejected' && options?.rejectionReason) {
      update.rejectionReason = options.rejectionReason;
    }
    const result = await col.findOneAndUpdate({ id }, { $set: update }, { returnDocument: 'after' });
    return result as Record<string, unknown> | null;
  },

  async seed(requests: Array<Record<string, unknown>>): Promise<number> {
    const db = await getMongoDb();
    const col = db.collection(COLL.tenant_requests);
    let seeded = 0;
    for (const r of requests) {
      const id = String(r.id ?? '');
      if (!id || !r.name || !r.email) continue;
      const existing = await col.findOne({ id });
      if (existing) continue;
      const submittedAt = (r.submittedAt as string) ?? now();
      await col.insertOne({
        id,
        referenceId: refId(),
        tenantType: r.tenantType ?? 'Employer',
        name: r.name,
        email: r.email,
        contactName: r.contactName ?? null,
        contactTitle: r.contactTitle ?? null,
        contactPhone: r.contactPhone ?? null,
        companyName: r.companyName ?? r.name ?? null,
        registrationId: r.registrationId ?? null,
        jurisdiction: r.jurisdiction ?? null,
        businessAddress: r.businessAddress ?? null,
        website: r.website ?? null,
        industry: r.industry ?? null,
        intendedUse: r.intendedUse ?? null,
        hiringVolume: r.hiringVolume ?? null,
        primaryIndustries: r.primaryIndustries ?? null,
        fundingSource: r.fundingSource ?? null,
        eligibilityOverview: r.eligibilityOverview ?? null,
        accreditation: r.accreditation ?? null,
        credentialTypes: r.credentialTypes ?? null,
        status: 'pending',
        submittedAt,
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        notes: null,
        createdAt: now(),
        updatedAt: now(),
      });
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
