/**
 * Credential issuance for tenant approval and reservations.
 * Builds MarketplaceProfileCredential and ReservationCredential (unsigned) for storage.
 */

import { randomUUID } from 'crypto';
import { marketplaceBaseUrl, marketplaceContextUri, marketplaceIssuer } from '../config';
import { toDatetimeString } from '../utils/datetime';

export interface TenantRequestForCredential {
  id: string;
  name: string;
  email: string;
  tenancyType?: string;
  industry?: string;
  website?: string;
  businessAddress?: string;
}

/** Build unsigned MarketplaceProfileCredential payload from tenant request */
export function buildMarketplaceProfileCredential(
  tenantRequest: TenantRequestForCredential
): Record<string, unknown> {
  const now = new Date();
  const validFrom = toDatetimeString(now);
  const validUntil = toDatetimeString(new Date(now.getFullYear(), 11, 31, 23, 59, 59));

  const credentialSubject: Record<string, unknown> = {
    id: tenantRequest.id,
    type: 'Organization',
    name: tenantRequest.name,
    email: tenantRequest.email,
    tenancyType: tenantRequest.tenancyType ?? 'Employer',
  };
  if (tenantRequest.website) credentialSubject.url = tenantRequest.website;
  if (tenantRequest.industry) credentialSubject.industry = tenantRequest.industry;
  if (tenantRequest.businessAddress) {
    credentialSubject.address = {
      type: 'PostalAddress',
      streetAddress: tenantRequest.businessAddress,
    };
  }

  const issuerObj: Record<string, unknown> = {
    id: marketplaceIssuer.id,
    name: marketplaceIssuer.name,
    ...(marketplaceIssuer.image && { image: marketplaceIssuer.image }),
    ...(marketplaceIssuer.description && { description: marketplaceIssuer.description }),
  };
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', marketplaceContextUri],
    type: ['VerifiableCredential', 'MarketplaceProfileCredential'],
    id: `urn:uuid:${randomUUID()}`,
    issuer: issuerObj,
    validFrom,
    validUntil,
    name: 'Apply Utopia Marketplace Profile',
    description: `Verifies that ${tenantRequest.name} is an approved participant on the Apply Utopia marketplace.`,
    credentialSubject,
  };
}

/** Tenant request data for marketplace tenancy reservation credential (includes KYC form data). */
export interface TenantRequestForReservation {
  id: string;
  referenceId?: string;
  tenancyType: string;
  name: string;
  email: string;
  submittedAt?: Date | string;
  status?: string;
  /** KYC: contact person */
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  /** KYC: organization */
  registrationId?: string;
  jurisdiction?: string;
  businessAddress?: string;
  website?: string;
  industry?: string;
  /** KYC: intended use */
  intendedUse?: string;
}

/** Generic reservation input (schema.org Reservation). */
export interface ReservationInput {
  /** Unique reservation ID (e.g. RES-2026-ABC123). If omitted, a urn:uuid is generated. */
  reservationId?: string;
  /** The thing being reserved */
  reservationFor: Record<string, unknown>;
  /** Person or organization the reservation is for (may include KYC fields) */
  underName: Record<string, unknown>;
  /** Service provider */
  provider?: { type: 'Person' | 'Organization'; name: string; id?: string };
  /** Broker that arranged the reservation */
  broker?: { type: 'Person' | 'Organization'; name: string; id?: string };
  totalPrice?: number | string;
  priceCurrency?: string;
  /** Credential name/description */
  name?: string;
  description?: string;
  /** Issuer object with name, image, description (defaults to marketplaceIssuer) */
  issuer?: { id?: string; name: string; image?: string; description?: string };
}

/** Build ReservationCredential for marketplace tenancy reservation (includes KYC form data). */
export function buildReservationCredentialFromTenantRequest(
  tenantRequest: TenantRequestForReservation
): Record<string, unknown> {
  const underName: Record<string, unknown> = {
    type: 'Organization',
    name: tenantRequest.name,
    email: tenantRequest.email,
    id: tenantRequest.id,
  };
  if (tenantRequest.contactName || tenantRequest.contactTitle || tenantRequest.contactPhone) {
    underName.contactPoint = {
      type: 'ContactPoint',
      ...(tenantRequest.contactName && { name: tenantRequest.contactName }),
      ...(tenantRequest.contactTitle && { jobTitle: tenantRequest.contactTitle }),
      ...(tenantRequest.contactPhone && { telephone: tenantRequest.contactPhone }),
    };
  }
  if (tenantRequest.registrationId) underName.registrationId = tenantRequest.registrationId;
  if (tenantRequest.jurisdiction) underName.jurisdiction = tenantRequest.jurisdiction;
  if (tenantRequest.businessAddress)
    underName.address = { type: 'PostalAddress', streetAddress: tenantRequest.businessAddress };
  if (tenantRequest.website) underName.url = tenantRequest.website;
  if (tenantRequest.industry) underName.industry = tenantRequest.industry;
  if (tenantRequest.intendedUse) underName.intendedUse = tenantRequest.intendedUse;

  return buildReservationCredential({
    reservationId: tenantRequest.referenceId ?? tenantRequest.id,
    reservationFor: {
      type: 'MarketplaceTenancy',
      name: 'Marketplace Tenancy',
      description: `Tenancy slot for ${tenantRequest.tenancyType} on the Apply Utopia marketplace`,
      tenancyType: tenantRequest.tenancyType,
    },
    underName,
    provider: {
      type: 'Organization',
      name: marketplaceIssuer.name,
      id: marketplaceBaseUrl,
    },
    name: 'Marketplace Tenancy Reservation',
    description: `Reservation for ${tenantRequest.name} to participate on the Apply Utopia marketplace as ${tenantRequest.tenancyType}.`,
    issuer: marketplaceIssuer,
  });
}

/** Build unsigned ReservationCredential payload from reservation data (schema.org/Reservation) */
export function buildReservationCredential(input: ReservationInput): Record<string, unknown> {
  const now = new Date();
  const subjectId = input.reservationId
    ? (input.reservationId.startsWith('urn:') ? input.reservationId : `urn:reservation:${input.reservationId}`)
    : `urn:uuid:${randomUUID()}`;
  const validFrom = toDatetimeString(now);
  const validUntil = toDatetimeString(new Date(now.getFullYear(), 11, 31, 23, 59, 59));

  const credentialSubject: Record<string, unknown> = {
    type: 'Reservation',
    reservationFor: input.reservationFor,
    underName: input.underName,
  };
  if (input.reservationId) credentialSubject.reservationId = input.reservationId;
  if (input.provider) credentialSubject.provider = input.provider;
  if (input.broker) credentialSubject.broker = input.broker;
  if (input.totalPrice != null) credentialSubject.totalPrice = input.totalPrice;
  if (input.priceCurrency) credentialSubject.priceCurrency = input.priceCurrency;

  const issuer = input.issuer ?? marketplaceIssuer;
  const issuerObj: Record<string, unknown> =
    typeof issuer === 'object'
      ? {
          id: issuer.id ?? marketplaceIssuer.id,
          name: issuer.name,
          ...(issuer.image && { image: issuer.image }),
          ...(issuer.description && { description: issuer.description }),
        }
      : {
          id: issuer,
          name: marketplaceIssuer.name,
          ...(marketplaceIssuer.image && { image: marketplaceIssuer.image }),
          ...(marketplaceIssuer.description && { description: marketplaceIssuer.description }),
        };

  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', marketplaceContextUri],
    type: ['VerifiableCredential', 'ReservationCredential'],
    id: subjectId,
    issuer: issuerObj,
    validFrom,
    validUntil,
    name: input.name ?? 'Reservation',
    description: input.description ?? 'Verifiable reservation.',
    credentialSubject,
  };
}
