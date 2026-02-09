"use strict";
/**
 * Build JobPostingCredential (unsigned) for job postings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildJobPostingCredential = buildJobPostingCredential;
const config_1 = require("../config");
const datetime_1 = require("../utils/datetime");
/** Build JobPostingCredential (without proof) from job posting data. */
function buildJobPostingCredential(jobId, input, issuer) {
    const now = new Date();
    const validFrom = (0, datetime_1.toDatetimeString)(now);
    const validUntil = input.validThrough ?? (0, datetime_1.toDatetimeString)(new Date(now.getFullYear(), 11, 31, 23, 59, 59));
    const credentialSubject = {
        id: jobId,
        type: 'JobPosting',
        title: input.title,
        description: input.description,
        datePosted: (0, datetime_1.toDatetimeString)(now),
        validThrough: validUntil,
        hiringOrganization: {
            type: 'Organization',
            id: input.employerWebsite ?? input.employerId,
            name: input.employerName,
        },
    };
    if (input.employmentType)
        credentialSubject.employmentType = input.employmentType;
    if (input.industry)
        credentialSubject.industry = input.industry;
    if (input.skills?.length)
        credentialSubject.skills = input.skills;
    if (input.qualifications?.length)
        credentialSubject.qualifications = input.qualifications;
    if (input.locationCity || input.locationRegion || input.locationCountry) {
        credentialSubject.jobLocation = {
            type: 'Place',
            address: {
                type: 'PostalAddress',
                ...(input.locationCity && { addressLocality: input.locationCity }),
                ...(input.locationRegion && { addressRegion: input.locationRegion }),
                ...(input.locationCountry && { addressCountry: input.locationCountry }),
            },
        };
    }
    if (input.salaryMin != null || input.salaryMax != null) {
        credentialSubject.baseSalary = {
            type: 'MonetaryAmount',
            currency: input.salaryCurrency ?? 'USD',
            value: {
                type: 'QuantitativeValue',
                ...(input.salaryMin != null && { minValue: input.salaryMin }),
                ...(input.salaryMax != null && { maxValue: input.salaryMax }),
                unitText: 'YEAR',
            },
        };
    }
    const issuerObj = {
        id: issuer.id,
        name: issuer.name,
        ...(issuer.description && { description: issuer.description }),
        ...(issuer.image && { image: issuer.image }),
    };
    return {
        '@context': ['https://www.w3.org/ns/credentials/v2', config_1.marketplaceContextUri],
        type: ['VerifiableCredential', 'JobPostingCredential'],
        id: jobId,
        issuer: issuerObj,
        validFrom,
        validUntil,
        name: `${input.title} Job Posting`,
        description: `Verifiable job posting from ${input.employerName}.`,
        credentialSubject,
    };
}
