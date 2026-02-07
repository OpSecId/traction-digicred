/**
 * Tenant and workflow DB operations for admin dashboard.
 */

import { randomUUID } from 'crypto';
import { getDb } from '../db';

export interface TenantRow {
  id: string;
  tenant_request_id: string | null;
  did: string | null;
  wallet_id: string | null;
  credential: string | null;
  status: string | null;
  created_at: string | null;
}

export interface WorkflowRow {
  id: string;
  tenant_request_id: string | null;
  workflow_type: string;
  status: string;
  current_step: string | null;
  payload: string | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

function tenantToJson(row: TenantRow) {
  return {
    id: row.id,
    tenantRequestId: row.tenant_request_id ?? undefined,
    did: row.did ?? undefined,
    walletId: row.wallet_id ?? undefined,
    credential: row.credential ? (JSON.parse(row.credential) as Record<string, unknown>) : undefined,
    status: row.status ?? 'active',
    createdAt: row.created_at ?? undefined,
  };
}

function workflowToJson(row: WorkflowRow) {
  return {
    id: row.id,
    tenantRequestId: row.tenant_request_id ?? undefined,
    workflowType: row.workflow_type,
    status: row.status,
    currentStep: row.current_step ?? undefined,
    payload: row.payload ? JSON.parse(row.payload) : undefined,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    errorMessage: row.error_message ?? undefined,
  };
}

export async function listTenants() {
  const db = await getDb();
  const { rows } = await db.query<TenantRow>(
    'SELECT * FROM tenants ORDER BY created_at DESC'
  );
  return rows.map(tenantToJson);
}

export async function getTenantById(id: string) {
  const db = await getDb();
  const { rows } = await db.query<TenantRow>('SELECT * FROM tenants WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return tenantToJson(rows[0]);
}

export async function revokeTenant(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.run('UPDATE tenants SET status = ? WHERE id = ?', ['revoked', id]);
  return (result.rowsAffected ?? 0) > 0;
}

export async function createTenant(
  tenantRequestId: string,
  options?: { did?: string; walletId?: string; credential?: Record<string, unknown> }
) {
  const db = await getDb();
  const existing = await db.query<TenantRow>(
    'SELECT * FROM tenants WHERE tenant_request_id = ?',
    [tenantRequestId]
  );
  if (existing.rows.length > 0) {
    const tenant = existing.rows[0];
    if (options?.credential) {
      await db.run('UPDATE tenants SET credential = ? WHERE id = ?', [
        JSON.stringify(options.credential),
        tenant.id,
      ]);
      const { rows } = await db.query<TenantRow>('SELECT * FROM tenants WHERE id = ?', [tenant.id]);
      return rows.length > 0 ? tenantToJson(rows[0]) : null;
    }
    return tenantToJson(tenant);
  }
  const id = `urn:uuid:${randomUUID()}`;
  const credentialJson = options?.credential ? JSON.stringify(options.credential) : null;
  await db.run(
    `INSERT INTO tenants (id, tenant_request_id, did, wallet_id, credential, status) VALUES (?, ?, ?, ?, ?, 'active')`,
    [id, tenantRequestId, options?.did ?? null, options?.walletId ?? null, credentialJson]
  );
  const { rows } = await db.query<TenantRow>('SELECT * FROM tenants WHERE id = ?', [id]);
  return rows.length > 0 ? tenantToJson(rows[0]) : null;
}

/** Create tenant manually (out-of-band onboarding). All fields optional except at least one identifier. */
export async function createTenantManual(options: {
  tenantRequestId?: string;
  did?: string;
  walletId?: string;
}) {
  const { tenantRequestId, did, walletId } = options;
  const db = await getDb();
  if (tenantRequestId) {
    const existing = await db.query<TenantRow>(
      'SELECT * FROM tenants WHERE tenant_request_id = ?',
      [tenantRequestId]
    );
    if (existing.rows.length > 0) {
      return tenantToJson(existing.rows[0]);
    }
  }
  const id = `urn:uuid:${randomUUID()}`;
  await db.run(
    `INSERT INTO tenants (id, tenant_request_id, did, wallet_id) VALUES (?, ?, ?, ?)`,
    [id, tenantRequestId ?? null, did ?? null, walletId ?? null]
  );
  const { rows } = await db.query<TenantRow>('SELECT * FROM tenants WHERE id = ?', [id]);
  return rows.length > 0 ? tenantToJson(rows[0]) : null;
}

export async function listWorkflowInstances() {
  const db = await getDb();
  const { rows } = await db.query<WorkflowRow>(
    'SELECT * FROM workflow_instances ORDER BY started_at DESC'
  );
  return rows.map(workflowToJson);
}

/** List workflow instances for an employer (by tenant id or tenant request id). */
export async function listWorkflowInstancesByEmployerId(employerId: string) {
  const db = await getDb();
  const tenantRows = await db.query<TenantRow>('SELECT tenant_request_id FROM tenants WHERE id = ?', [employerId]);
  const tenantRequestId = tenantRows.rows[0]?.tenant_request_id ?? employerId;
  const { rows } = await db.query<WorkflowRow>(
    'SELECT * FROM workflow_instances WHERE tenant_request_id = ? ORDER BY started_at DESC',
    [tenantRequestId]
  );
  return rows.map(workflowToJson);
}

export async function createWorkflowInstance(
  tenantRequestId: string,
  workflowType: string
) {
  const id = `urn:uuid:${randomUUID()}`;
  const startedAt = new Date().toISOString();
  const db = await getDb();
  await db.run(
    `INSERT INTO workflow_instances (id, tenant_request_id, workflow_type, status, started_at)
     VALUES (?, ?, ?, 'running', ?)`,
    [id, tenantRequestId, workflowType, startedAt]
  );
  const { rows } = await db.query<WorkflowRow>('SELECT * FROM workflow_instances WHERE id = ?', [id]);
  return rows.length > 0 ? workflowToJson(rows[0]) : null;
}
