/**
 * Marketplace plugin controller - proxies to ACA-Py multitenant agent.
 * Create invitation, analyze transcript. Uses MARKETPLACE_AGENCY_URI + API key.
 */

import { agentRequest } from './agentClient';
import { marketplaceAgencyConfig } from '../config';

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

export interface TranscriptAnalysisRequest {
  credential_data: Record<string, unknown>;
}

export interface TranscriptAnalysisResponse {
  skills: string[];
  courses: Array<{ name?: string; grade?: string; credits?: unknown }>;
  gpa?: string;
  program?: string;
  overview?: string;
}

export const marketplaceController = {
  config: marketplaceAgencyConfig,

  async createInvitation(body?: MarketplaceInvitationRequest): Promise<MarketplaceInvitationResponse> {
    return agentRequest(marketplaceAgencyConfig, '/marketplace/invitation', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  },

  async analyzeTranscript(body: TranscriptAnalysisRequest): Promise<TranscriptAnalysisResponse> {
    return agentRequest(marketplaceAgencyConfig, '/marketplace/analyze-transcript', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
