"use strict";
/**
 * MongoDB repositories for marketplace data.
 * Replaces pluginDb for storage; plugin still used for tenant provisioning.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentialAnalysisConfigRepo = exports.invitationRepo = exports.jobPostingRepo = exports.employerProfileRepo = exports.workflowRepo = exports.tenantRepo = exports.tenantRequestRepo = void 0;
const crypto_1 = require("crypto");
const credentialIssuanceController_1 = require("../controllers/credentialIssuanceController");
const mongodb_1 = require("../db/mongodb");
const COLL = {
    reservations: 'reservations',
    tenants: 'tenants',
    workflow_instances: 'workflow_instances',
    employer_profiles: 'employer_profiles',
    job_postings: 'job_postings',
    credential_analysis_config: 'credential_analysis_config',
    invitations: 'invitations',
};
function refId() {
    return `REQ-${(0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}
function now() {
    return new Date().toISOString();
}
/** Remove keys with null or undefined values from an object (shallow). */
function stripNulls(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v != null)
            out[k] = v;
    }
    return out;
}
/** Hydrate API response from stored doc (credential + workflow). Derive fields from credential. */
function hydrateFromDoc(doc) {
    const cred = doc.credential;
    if (!cred?.credentialSubject)
        return doc;
    const subj = cred.credentialSubject;
    const underName = subj.underName;
    const reservationFor = subj.reservationFor;
    const contactPoint = underName?.contactPoint;
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
        businessAddress: underName?.address?.streetAddress,
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
function reservationIdQuery(id) {
    return {
        $or: [
            { 'credential.id': id },
            { 'credential.credentialSubject.reservationId': id },
            { 'credential.credentialSubject.underName.id': id },
        ],
    };
}
// Tenant requests – store credential as source of truth, no duplicate fields, no nulls
exports.tenantRequestRepo = {
    async create(input) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.reservations);
        const id = `urn:uuid:${(0, crypto_1.randomUUID)()}`;
        const referenceId = refId();
        const submittedAt = now();
        const credential = (0, credentialIssuanceController_1.buildReservationCredentialFromTenantRequest)({
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
    async list() {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.reservations);
        const cursor = col.find({}).sort({ submittedAt: -1 });
        const docs = await cursor.toArray();
        return docs.map((d) => hydrateFromDoc(d));
    },
    async getById(id) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.reservations);
        const doc = await col.findOne(reservationIdQuery(id));
        return doc ? hydrateFromDoc(doc) : null;
    },
    async updateStatus(id, status, options) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.reservations);
        const existing = await col.findOne(reservationIdQuery(id));
        if (!existing)
            return null;
        const update = stripNulls({
            status,
            reviewedAt: now(),
            ...(options?.reviewedBy && { reviewedBy: options.reviewedBy }),
            ...(status === 'rejected' && options?.rejectionReason && { rejectionReason: options.rejectionReason }),
            updatedAt: now(),
        });
        const result = await col.findOneAndUpdate(reservationIdQuery(id), { $set: update }, { returnDocument: 'after' });
        return result ? hydrateFromDoc(result) : null;
    },
    async seed(requests) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.reservations);
        let seeded = 0;
        for (const r of requests) {
            const name = r.name != null ? String(r.name) : '';
            const email = r.email != null ? String(r.email) : '';
            if (!name || !email)
                continue;
            const id = `urn:uuid:${(0, crypto_1.randomUUID)()}`;
            const referenceId = refId();
            const submittedAt = r.submittedAt ?? now();
            const credential = (0, credentialIssuanceController_1.buildReservationCredentialFromTenantRequest)({
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
            const credId = credential.id;
            if (await col.findOne(reservationIdQuery(credId)))
                continue;
            await col.insertOne(doc);
            seeded++;
        }
        return seeded;
    },
};
// Tenants
exports.tenantRepo = {
    async list() {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.tenants);
        return col.find({}).toArray();
    },
    async getById(id) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.tenants);
        const doc = await col.findOne({ id });
        return doc;
    },
    async getByShortId(shortId) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.tenants);
        const doc = await col.findOne({ shortId });
        return doc;
    },
    async create(data) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.tenants);
        const id = `urn:uuid:${(0, crypto_1.randomUUID)()}`;
        const shortId = data.shortId ?? (0, crypto_1.randomBytes)(6).toString('base64url');
        const doc = {
            id,
            shortId,
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
    async createManual(options) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.tenants);
        const id = options.did ?? `urn:uuid:${(0, crypto_1.randomUUID)()}`;
        const shortId = options.shortId ?? (0, crypto_1.randomBytes)(6).toString('base64url');
        const doc = {
            id,
            shortId,
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
    async revoke(id) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.tenants);
        const result = await col.updateOne({ id }, { $set: { status: 'revoked', updatedAt: now() } });
        return result.modifiedCount > 0;
    },
    async setApiKey(tenantId, apiKey) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.tenants);
        await col.updateOne({ id: tenantId }, { $set: { apiKey, updatedAt: now() } });
    },
    async findByEmailAndApiKey(email, apiKey) {
        const db = await (0, mongodb_1.getMongoDb)();
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
        return docs.length ? docs[0] : null;
    },
    /** Save tenant from plugin provisioning response (handles snake_case or camelCase) */
    async saveFromPlugin(tenant, shortId) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.tenants);
        const id = String(tenant.id ?? tenant.wallet_id ?? tenant.walletId ?? `urn:uuid:${(0, crypto_1.randomUUID)()}`);
        const existing = await col.findOne({ id });
        const resolvedShortId = shortId ?? existing?.shortId ?? (0, crypto_1.randomBytes)(6).toString('base64url');
        const doc = {
            id,
            shortId: resolvedShortId,
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
exports.workflowRepo = {
    async list() {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.workflow_instances);
        return col.find({}).sort({ startedAt: -1 }).toArray();
    },
    async listByEmployerId(employerId) {
        const tenant = await exports.tenantRepo.getById(employerId);
        const tenantRequestId = (tenant?.tenantRequestId ?? employerId);
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.workflow_instances);
        return col.find({ tenantRequestId }).sort({ startedAt: -1 }).toArray();
    },
    async create(tenantRequestId, workflowType) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.workflow_instances);
        const id = `urn:uuid:${(0, crypto_1.randomUUID)()}`;
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
exports.employerProfileRepo = {
    async get(employerId) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.employer_profiles);
        const doc = await col.findOne({ employerId });
        return doc;
    },
    async create(employerId, credential) {
        const db = await (0, mongodb_1.getMongoDb)();
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
    async ensure(employerId, credential) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.employer_profiles);
        const nowStr = now();
        const result = await col.findOneAndUpdate({ employerId }, {
            $set: { credential, updatedAt: nowStr },
            $setOnInsert: { employerId, createdAt: nowStr },
        }, { returnDocument: 'after', upsert: true });
        return result;
    },
};
// Job postings - visibility: true = on marketplace, false = hidden. status: 'active' = open, 'revoked' = cancelled/completed
exports.jobPostingRepo = {
    /** Marketplace browse: only visible, non-revoked jobs */
    async listAll() {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.job_postings);
        const filter = {
            $and: [
                { $or: [{ visibility: true }, { visibility: { $exists: false } }] },
                { status: { $ne: 'revoked' } },
            ],
        };
        const docs = await col.find(filter).sort({ datePosted: -1 }).toArray();
        const jobs = [];
        for (const doc of docs) {
            const job = doc;
            const employerId = job.employerId;
            const profile = employerId ? await exports.employerProfileRepo.get(employerId) : null;
            const cred = profile?.credential;
            const subj = cred?.credentialSubject;
            const employerName = subj?.name ?? 'Employer';
            const logo = subj?.image;
            jobs.push({
                ...job,
                name: job.title,
                employerName,
                employerLogo: logo,
                employerImage: logo,
                category: job.industry ?? 'General',
            });
        }
        return jobs;
    },
    async listByEmployer(employerId) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.job_postings);
        return col.find({ employerId }).sort({ datePosted: -1 }).toArray();
    },
    async getById(id) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.job_postings);
        const doc = await col.findOne({ id });
        return doc;
    },
    async create(data) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.job_postings);
        const id = data.id ?? `urn:uuid:${(0, crypto_1.randomUUID)()}`;
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
            visibility: data.visibility ?? true,
            status: data.status ?? 'active',
            createdAt: nowStr,
            updatedAt: nowStr,
        };
        await col.insertOne(doc);
        return doc;
    },
    async update(id, patch) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.job_postings);
        const updateDoc = { updatedAt: now() };
        if (patch.visibility !== undefined)
            updateDoc.visibility = patch.visibility;
        if (patch.status !== undefined)
            updateDoc.status = patch.status;
        const result = await col.findOneAndUpdate({ id }, { $set: updateDoc }, { returnDocument: 'after' });
        return result;
    },
};
// OOB invitations (short URL storage; id is oob_id UUID)
exports.invitationRepo = {
    async insert(data) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.invitations);
        const id = data.oobId ?? (0, crypto_1.randomBytes)(6).toString('base64url');
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
    async getById(id) {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.invitations);
        const doc = await col.findOne({ id });
        return doc;
    },
    async getLatest() {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.invitations);
        const doc = await col.findOne({}, { sort: { createdAt: -1 } });
        return doc;
    },
};
// Credential analysis config
exports.credentialAnalysisConfigRepo = {
    async get() {
        const db = await (0, mongodb_1.getMongoDb)();
        const col = db.collection(COLL.credential_analysis_config);
        const doc = (await col.findOne({ id: 'default' }));
        if (!doc?.config)
            return { enabled: false };
        try {
            return JSON.parse(doc.config);
        }
        catch {
            return { enabled: false };
        }
    },
    async update(config) {
        const db = await (0, mongodb_1.getMongoDb)();
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
