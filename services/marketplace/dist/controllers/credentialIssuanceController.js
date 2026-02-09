"use strict";
/**
 * Credential issuance for tenant approval and reservations.
 * Builds MarketplaceProfileCredential and ReservationCredential (unsigned) for storage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMarketplaceProfileCredential = buildMarketplaceProfileCredential;
exports.buildReservationCredentialFromTenantRequest = buildReservationCredentialFromTenantRequest;
exports.buildReservationCredential = buildReservationCredential;
const crypto_1 = require("crypto");
const config_1 = require("../config");
const datetime_1 = require("../utils/datetime");
/** Build unsigned MarketplaceProfileCredential payload from tenant request */
function buildMarketplaceProfileCredential(tenantRequest) {
    const now = new Date();
    const validFrom = (0, datetime_1.toDatetimeString)(now);
    const validUntil = (0, datetime_1.toDatetimeString)(new Date(now.getFullYear(), 11, 31, 23, 59, 59));
    const credentialSubject = {
        id: tenantRequest.subjectId ?? tenantRequest.id,
        type: 'Organization',
        name: tenantRequest.name,
        tenancyType: tenantRequest.tenancyType ?? 'Employer',
        contactPoint: {
            type: 'ContactPoint',
            email: tenantRequest.email,
        },
    };
    if (tenantRequest.website)
        credentialSubject.url = tenantRequest.website;
    if (tenantRequest.industry)
        credentialSubject.industry = tenantRequest.industry;
    if (tenantRequest.businessAddress) {
        credentialSubject.address = {
            type: 'PostalAddress',
            streetAddress: tenantRequest.businessAddress,
        };
    }
    const issuerObj = {
        id: config_1.marketplaceIssuer.id,
        name: config_1.marketplaceIssuer.name,
        ...(config_1.marketplaceIssuer.image && { image: config_1.marketplaceIssuer.image }),
        ...(config_1.marketplaceIssuer.description && { description: config_1.marketplaceIssuer.description }),
    };
    return {
        '@context': ['https://www.w3.org/ns/credentials/v2', config_1.marketplaceContextUri],
        type: ['VerifiableCredential', 'MarketplaceProfileCredential'],
        id: `urn:uuid:${(0, crypto_1.randomUUID)()}`,
        issuer: issuerObj,
        validFrom,
        validUntil,
        name: 'Apply Utopia Marketplace Profile',
        description: `Verifies that ${tenantRequest.name} is an approved participant on the Apply Utopia marketplace.`,
        credentialSubject,
    };
}
/** Build ReservationCredential for marketplace tenancy reservation (includes KYC form data). */
function buildReservationCredentialFromTenantRequest(tenantRequest) {
    const underName = {
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
    if (tenantRequest.registrationId)
        underName.registrationId = tenantRequest.registrationId;
    if (tenantRequest.jurisdiction)
        underName.jurisdiction = tenantRequest.jurisdiction;
    if (tenantRequest.businessAddress)
        underName.address = { type: 'PostalAddress', streetAddress: tenantRequest.businessAddress };
    if (tenantRequest.website)
        underName.url = tenantRequest.website;
    if (tenantRequest.industry)
        underName.industry = tenantRequest.industry;
    if (tenantRequest.intendedUse)
        underName.intendedUse = tenantRequest.intendedUse;
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
            name: config_1.marketplaceIssuer.name,
            id: config_1.marketplaceBaseUrl,
        },
        name: 'Marketplace Tenancy Reservation',
        description: `Reservation for ${tenantRequest.name} to participate on the Apply Utopia marketplace as ${tenantRequest.tenancyType}.`,
        issuer: config_1.marketplaceIssuer,
    });
}
/** Build unsigned ReservationCredential payload from reservation data (schema.org/Reservation) */
function buildReservationCredential(input) {
    const now = new Date();
    const subjectId = input.reservationId
        ? (input.reservationId.startsWith('urn:') ? input.reservationId : `urn:reservation:${input.reservationId}`)
        : `urn:uuid:${(0, crypto_1.randomUUID)()}`;
    const validFrom = (0, datetime_1.toDatetimeString)(now);
    const validUntil = (0, datetime_1.toDatetimeString)(new Date(now.getFullYear(), 11, 31, 23, 59, 59));
    const credentialSubject = {
        type: 'Reservation',
        reservationFor: input.reservationFor,
        underName: input.underName,
    };
    if (input.reservationId)
        credentialSubject.reservationId = input.reservationId;
    if (input.provider)
        credentialSubject.provider = input.provider;
    if (input.broker)
        credentialSubject.broker = input.broker;
    if (input.totalPrice != null)
        credentialSubject.totalPrice = input.totalPrice;
    if (input.priceCurrency)
        credentialSubject.priceCurrency = input.priceCurrency;
    const issuer = input.issuer ?? config_1.marketplaceIssuer;
    const issuerObj = typeof issuer === 'object'
        ? {
            id: issuer.id ?? config_1.marketplaceIssuer.id,
            name: issuer.name,
            ...(issuer.image && { image: issuer.image }),
            ...(issuer.description && { description: issuer.description }),
        }
        : {
            id: issuer,
            name: config_1.marketplaceIssuer.name,
            ...(config_1.marketplaceIssuer.image && { image: config_1.marketplaceIssuer.image }),
            ...(config_1.marketplaceIssuer.description && { description: config_1.marketplaceIssuer.description }),
        };
    return {
        '@context': ['https://www.w3.org/ns/credentials/v2', config_1.marketplaceContextUri],
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
