/**
 * Admin API client - tenants, trust registries, workflows, marketplace.
 */

import axios from 'axios';

const API_TIMEOUT_MS = 8000;

export interface CredentialAnalysisConfig {
  credentialTypes: string[];
  extraction: {
    includeProgram: boolean;
    includeGpa: boolean;
    includeCourses: boolean;
    maxCourses: number;
  };
  matching: {
    matchFields: string[];
    minScore: number;
  };
  enabled: boolean;
}

export interface MarketplaceInvitationRequest {
  content_url?: string;
  goal?: string;
  multi_use?: boolean;
  image_url?: string;
}

export interface MarketplaceInvitationResponse {
  invitation: Record<string, unknown>;
  invitation_url: string;
  oob_id: string;
}

export interface ActionMenuConfig {
  title: string;
  description: string;
  items: Array<{ title: string; description?: string }>;
  /** Credential types to request in presentation (from trust registry). */
  presentationRequestCredentialTypes?: string[];
}

export interface Tenant {
  id: string;
  tenantRequestId?: string;
  did?: string;
  walletId?: string;
  credential?: Record<string, unknown>;
  status?: string;
  createdAt?: string;
}

export interface TenantRequest {
  id: string;
  referenceId?: string;
  tenancyType?: string;
  name: string;
  email: string;
  contactName?: string;
  contactTitle?: string;
  industry?: string;
  website?: string;
  businessAddress?: string;
  status?: string;
  submittedAt?: string;
}

export interface TenantDetails {
  tenant: Tenant;
  tenantRequest: TenantRequest | null;
}

export interface TrustRegistry {
  id: string;
  name: string;
  type: string;
  did?: string;
  credentialTypes?: string[];
  logo?: string;
  website?: string;
}

export interface Workflow {
  id: string;
  tenantRequestId?: string;
  workflowType: string;
  status: string;
  currentStep?: string;
  payload?: unknown;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export async function listTenants(): Promise<Tenant[]> {
  const res = await axios.get<{ tenants: Tenant[] }>('/api/innkeeper/tenants', {
    timeout: API_TIMEOUT_MS,
  });
  return res.data?.tenants ?? [];
}

export async function getTenantDetails(id: string): Promise<TenantDetails> {
  const res = await axios.get<TenantDetails>(`/api/innkeeper/tenants/${id}`, {
    timeout: API_TIMEOUT_MS,
  });
  return res.data;
}

export async function revokeTenant(id: string): Promise<void> {
  await axios.post(`/api/innkeeper/tenants/${id}/revoke`, {}, {
    timeout: API_TIMEOUT_MS,
  });
}

export async function createTenant(data: {
  tenantRequestId?: string;
  did?: string;
  walletId?: string;
}): Promise<Tenant> {
  const res = await axios.post<Tenant>('/api/innkeeper/tenants', data, {
    timeout: API_TIMEOUT_MS,
  });
  return res.data;
}

export async function getCredentialAnalysisConfig(): Promise<CredentialAnalysisConfig> {
  const res = await axios.get<CredentialAnalysisConfig>('/api/innkeeper/credential-analysis', {
    timeout: API_TIMEOUT_MS,
  });
  return res.data;
}

export async function updateCredentialAnalysisConfig(
  config: Partial<CredentialAnalysisConfig>
): Promise<CredentialAnalysisConfig> {
  const res = await axios.put<CredentialAnalysisConfig>('/api/innkeeper/credential-analysis', config, {
    timeout: API_TIMEOUT_MS,
  });
  return res.data;
}

/** Course list format for transcript-skills-analysis lambda: [title, code] pairs */
export type CourseListEntry = [string, string];

export interface SkillOfInterest {
  name: string;
  category?: string;
  pathways?: string;
  count?: number;
  max_skill_level?: number;
  skill_level_average?: string;
  courses?: Array<[string, number]>;
}

export interface TranscriptSkillsAnalysisResponse {
  count: string;
  skills_of_interest: SkillOfInterest[];
  skill_level_counts: [number, number, number];
  summary: string;
  course_ids: string[];
}

export async function analyzeTranscriptSkills(coursesList: CourseListEntry[]): Promise<TranscriptSkillsAnalysisResponse> {
  const res = await axios.post<TranscriptSkillsAnalysisResponse>('/api/innkeeper/transcript-skills-analysis', {
    coursesList,
  }, { timeout: 60000 });
  return res.data;
}

export async function listTrustRegistries(): Promise<TrustRegistry[]> {
  const res = await axios.get<{ trustRegistries: TrustRegistry[] }>('/api/innkeeper/trust-registries', {
    timeout: API_TIMEOUT_MS,
  });
  return res.data?.trustRegistries ?? [];
}

export async function addTrustRegistryEntry(data: {
  name: string;
  type?: string;
  did?: string;
  credentialTypes?: string[];
  logo?: string;
  website?: string;
}): Promise<TrustRegistry> {
  const res = await axios.post<TrustRegistry>('/api/innkeeper/trust-registries', data, {
    timeout: API_TIMEOUT_MS,
  });
  return res.data;
}

/** Union of credential types across all trust registries (sorted). */
export function getTrustRegistryCredentialTypes(registries: TrustRegistry[]): string[] {
  const types = new Set<string>();
  for (const r of registries) {
    for (const t of r.credentialTypes ?? []) types.add(t);
  }
  return [...types].sort();
}

export async function listWorkflows(): Promise<Workflow[]> {
  const res = await axios.get<{ workflows: Workflow[] }>('/api/innkeeper/workflows', {
    timeout: API_TIMEOUT_MS,
  });
  return res.data?.workflows ?? [];
}

export async function createWorkflow(
  tenantRequestId: string,
  workflowType: string
): Promise<Workflow | null> {
  const res = await axios.post<Workflow>('/api/innkeeper/workflows', {
    tenantRequestId,
    workflowType,
  }, { timeout: API_TIMEOUT_MS });
  return res.data ?? null;
}

export async function createMarketplaceInvitation(
  body?: MarketplaceInvitationRequest
): Promise<MarketplaceInvitationResponse> {
  const res = await axios.post<MarketplaceInvitationResponse>(
    '/api/innkeeper/marketplace/invitation',
    body ?? {},
    { timeout: API_TIMEOUT_MS }
  );
  return res.data;
}

export async function analyzeTranscript(credentialData: Record<string, unknown>): Promise<{
  skills: string[];
  courses: Array<{ name?: string; grade?: string; credits?: unknown }>;
  gpa?: string;
  program?: string;
  overview?: string;
}> {
  const res = await axios.post('/api/innkeeper/marketplace/analyze-transcript', {
    credential_data: credentialData,
  }, { timeout: API_TIMEOUT_MS });
  return res.data;
}

export async function getActionMenuConfig(): Promise<ActionMenuConfig> {
  const res = await axios.get<ActionMenuConfig>('/api/innkeeper/marketplace/action-menu', {
    timeout: API_TIMEOUT_MS,
  });
  return res.data;
}

export async function updateActionMenuConfig(config: ActionMenuConfig): Promise<ActionMenuConfig> {
  const res = await axios.put<ActionMenuConfig>('/api/innkeeper/marketplace/action-menu', config, {
    timeout: API_TIMEOUT_MS,
  });
  return res.data;
}
