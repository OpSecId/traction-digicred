"use strict";
/**
 * Build MarketplaceProfileCredential (unsigned) for employers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEmployerProfileCredential = buildEmployerProfileCredential;
const crypto_1 = require("crypto");
const config_1 = require("../config");
const datetime_1 = require("../utils/datetime");
/** Build MarketplaceProfileCredential (without proof) for an employer */
function buildEmployerProfileCredential(input) {
    const now = new Date();
    const validFrom = (0, datetime_1.toDatetimeString)(now);
    const validUntil = (0, datetime_1.toDatetimeString)(new Date(now.getFullYear(), 11, 31, 23, 59, 59));
    const credentialSubject = {
        id: input.subjectId ?? input.employerId,
        type: 'Organization',
        name: input.employerName,
        tenancyType: 'Employer',
    };
    if (input.industry)
        credentialSubject.industry = input.industry;
    if (input.website)
        credentialSubject.url = input.website;
    if (input.employerEmail) {
        credentialSubject.contactPoint = { type: 'ContactPoint', email: input.employerEmail };
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
        description: `Verifies that ${input.employerName} is an approved employer on the Apply Utopia marketplace.`,
        credentialSubject,
    };
}
