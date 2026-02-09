# Marketplace Credential Schemas

This directory defines W3C Verifiable Credential schemas for the Apply Utopia marketplace, aligned with [schema.org](https://schema.org) and [W3C VCDM 2.0](https://www.w3.org/TR/vc-data-model-2.0/).

## JSON-LD Context

Use `marketplace-context.jsonld` to resolve marketplace-specific terms in credentials. Reference it as the third item in `@context`:

```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://schema.org",
    "https://marketplace.example.com/ns/marketplace/v1"
  ],
  "type": ["VerifiableCredential", "MarketplaceProfileCredential"],
  ...
}
```

**Custom terms defined:**

| Term | URI | Description |
|------|-----|-------------|
| MarketplaceProfileCredential | `https://marketplace.example.com/vocab#MarketplaceProfileCredential` | Credential type for approved marketplace participants |
| JobPostingCredential | `https://marketplace.example.com/vocab#JobPostingCredential` | Credential type for verifiable job listings |
| CourseCredential | `https://marketplace.example.com/vocab#CourseCredential` | Credential type for verifiable course listings (schema.org Course) |
| ProgramCredential | `https://marketplace.example.com/vocab#ProgramCredential` | Credential type for verifiable program listings (schema.org EducationalOccupationalProgram) |
| WorkBasedProgramCredential | `https://marketplace.example.com/vocab#WorkBasedProgramCredential` | Credential type for verifiable apprenticeship/work-based programs (schema.org WorkBasedProgram) |
| ReservationCredential | `https://marketplace.example.com/vocab#ReservationCredential` | Credential type for marketplace tenancy reservations (includes KYC data) |
| MarketplaceTenancy | `https://marketplace.example.com/vocab#MarketplaceTenancy` | The tenancy slot being reserved |
| tenancyType | `https://marketplace.example.com/vocab#tenancyType` | Participant type: Employer, Scholarship Admin, Education Institution, Government Service |

## Credential Types

### MarketplaceProfileCredential

Attests that an organization is an approved marketplace participant (employer, scholarship admin, or education institution). Uses schema.org `Organization`.

- **credentialSubject**: `Organization` type with `name`, `email`, `url`, `address`, `industry`, `tenancyType`
- **validFrom** / **validUntil**: VCDM 2.0 validity period (not deprecated `issuanceDate`/`expirationDate`)

### JobPostingCredential

Verifiable job listing. Uses schema.org `JobPosting`.

- **credentialSubject**: `JobPosting` type with `title`, `description`, `datePosted`, `validThrough`, `employmentType`, `hiringOrganization`, `jobLocation`, `baseSalary`, `skills`, `qualifications`, `industry`

### CourseCredential

Verifiable course listing from education institutions. Uses schema.org [Course](https://schema.org/Course).

- **credentialSubject**: `Course` type with `name`, `description`, `courseCode`, `numberOfCredits`, `coursePrerequisites`, `educationalCredentialAwarded`, `provider`, `hasCourseInstance` (array of CourseInstance with `courseMode`, `startDate`, `endDate`, `location`)

### ProgramCredential

Verifiable degree or certificate program listing. Uses schema.org [EducationalOccupationalProgram](https://schema.org/EducationalOccupationalProgram).

- **credentialSubject**: `EducationalOccupationalProgram` type with `name`, `description`, `url`, `applicationStartDate`, `applicationDeadline`, `educationalProgramMode`, `educationalCredentialAwarded`, `numberOfCredits`, `timeToComplete`, `provider`, `programPrerequisites`, `maximumEnrollment`, `offers` (tuition/fees)

### WorkBasedProgramCredential

Verifiable apprenticeship or work-based training program. Uses schema.org [WorkBasedProgram](https://schema.org/WorkBasedProgram).

- **credentialSubject**: `WorkBasedProgram` type with `name`, `description`, `occupationalCategory`, `occupationalCredentialAwarded`, `trainingSalary`, `salaryUponCompletion`, `provider`, `timeToComplete`

### ReservationCredential

Marketplace tenancy reservation. Uses schema.org [Reservation](https://schema.org/Reservation). Created when an organization submits an onboarding request; includes KYC form data.

- **credentialSubject**: `Reservation` type with `reservationId`, `reservationFor` (MarketplaceTenancy), `underName` (Organization with KYC: `contactPoint` (schema.org ContactPoint), `registrationId`, `jurisdiction`, `address`, `url`, `industry`, `intendedUse`), `provider`

## Signing

Credentials are signed via the ACA-Py `/vc/sign` endpoint (Ed25519Signature2020, did:key).
