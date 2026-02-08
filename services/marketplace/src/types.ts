/** Credential analysis workflow config (admin-editable) */
export interface CredentialAnalysisConfig {
  credentialTypes?: string[];
  extraction?: { includeProgram?: boolean; includeGpa?: boolean; includeCourses?: boolean; maxCourses?: number };
  matching?: { matchFields?: string[]; minScore?: number };
  enabled?: boolean;
}
