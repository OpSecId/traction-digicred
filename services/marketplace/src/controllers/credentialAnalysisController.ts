/**
 * Credential analysis workflow config - admin-editable.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { getDb } from '../db';

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

const DEFAULT_CONFIG: CredentialAnalysisConfig = {
  credentialTypes: ['CollegeTranscript', 'HighSchoolTranscript', 'Diploma', 'StudentCard'],
  extraction: {
    includeProgram: true,
    includeGpa: true,
    includeCourses: true,
    maxCourses: 20,
  },
  matching: {
    matchFields: ['industry', 'occupation', 'educationRequirements'],
    minScore: 0.2,
  },
  enabled: true,
};

function loadDefaultFromYaml(): CredentialAnalysisConfig {
  const candidates = [
    path.join(__dirname, '../../config/credential-analysis.yaml'),
    path.join(process.cwd(), 'config/credential-analysis.yaml'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const contents = fs.readFileSync(p, 'utf8');
        const data = yaml.load(contents) as Partial<CredentialAnalysisConfig>;
        return {
          ...DEFAULT_CONFIG,
          ...data,
          extraction: { ...DEFAULT_CONFIG.extraction, ...data.extraction },
          matching: { ...DEFAULT_CONFIG.matching, ...data.matching },
        };
      }
    } catch {
      continue;
    }
  }
  return DEFAULT_CONFIG;
}

export async function getCredentialAnalysisConfig(): Promise<CredentialAnalysisConfig> {
  const db = await getDb();
  const { rows } = await db.query<{ config: string }>(
    'SELECT config FROM credential_analysis_config WHERE id = ?',
    ['default']
  );
  if (rows.length > 0) {
    try {
      return JSON.parse(rows[0].config) as CredentialAnalysisConfig;
    } catch {
      return loadDefaultFromYaml();
    }
  }
  const defaultConfig = loadDefaultFromYaml();
  await db.run(
    'INSERT INTO credential_analysis_config (id, config) VALUES (?, ?)',
    ['default', JSON.stringify(defaultConfig)]
  );
  return defaultConfig;
}

export async function updateCredentialAnalysisConfig(
  config: CredentialAnalysisConfig,
  updatedBy?: string
): Promise<CredentialAnalysisConfig> {
  const db = await getDb();
  const now = new Date().toISOString();
  const merged: CredentialAnalysisConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    extraction: { ...DEFAULT_CONFIG.extraction, ...config.extraction },
    matching: { ...DEFAULT_CONFIG.matching, ...config.matching },
  };
  await db.run(
    `INSERT INTO credential_analysis_config (id, config, updated_at, updated_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ['default', JSON.stringify(merged), now, updatedBy ?? null]
  );
  return merged;
}
