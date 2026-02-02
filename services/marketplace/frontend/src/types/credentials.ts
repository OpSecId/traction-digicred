export interface CredentialSubject {
  givenName?: string;
  familyName?: string;
  validFrom?: string;
  validUntil?: string;
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
