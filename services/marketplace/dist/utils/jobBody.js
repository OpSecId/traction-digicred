"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJobBody = parseJobBody;
/** Extract JobPostingInput from request body with type coercion. */
function parseJobBody(body) {
    const str = (k) => (typeof body[k] === 'string' ? body[k] : undefined);
    const num = (k) => (typeof body[k] === 'number' ? body[k] : undefined);
    return {
        employerId: String(body.employerId ?? ''),
        employerName: String(body.employerName ?? ''),
        employerEmail: str('employerEmail'),
        employerIndustry: str('employerIndustry'),
        employerWebsite: str('employerWebsite'),
        title: String(body.title ?? ''),
        description: String(body.description ?? ''),
        employmentType: str('employmentType'),
        locationCity: str('locationCity'),
        locationRegion: str('locationRegion'),
        locationCountry: str('locationCountry'),
        locationType: str('locationType'),
        salaryMin: num('salaryMin'),
        salaryMax: num('salaryMax'),
        salaryCurrency: str('salaryCurrency'),
        salaryDisplay: str('salaryDisplay'),
        skills: Array.isArray(body.skills) ? body.skills : undefined,
        qualifications: Array.isArray(body.qualifications) ? body.qualifications : undefined,
        benefits: str('benefits'),
        industry: str('industry'),
        validThrough: str('validThrough'),
    };
}
