/** Course or class taken (transcript-specific, no PII) */
export interface TranscriptCourse {
  name: string;
  grade?: string;
  credits?: number;
  semester?: string;
}

export interface CredentialSubject {
  givenName?: string;
  familyName?: string;
  validFrom?: string;
  validUntil?: string;
  /** Program or degree (e.g. "Bachelor of Science in Nursing") */
  program?: string;
  /** GPA (e.g. "3.7") */
  gpa?: string;
  /** Graduation or completion date */
  graduationDate?: string;
  /** Courses taken */
  courses?: TranscriptCourse[];
  [key: string]: unknown;
}

export interface DemoCredential {
  id: string;
  type: string;
  name: string;
  /** Issuing institution (e.g. school / university name) */
  establishmentName?: string;
  /** Background image URL for the credential card */
  backgroundImage?: string;
  /** Establishment logo URL (shown on the right) */
  logo?: string;
  credentialSubject?: CredentialSubject;
}
