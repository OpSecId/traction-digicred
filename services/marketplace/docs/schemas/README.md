# Marketplace Credential Schemas

This directory defines W3C Verifiable Credential schemas for the Apply Utopia marketplace, aligned with [schema.org](https://schema.org) and [W3C VCDM 2.0](https://www.w3.org/TR/vc-data-model-2.0/).

## JSON-LD Context

Use `marketplace-context.jsonld` to resolve marketplace-specific terms in credentials. Reference it as the third item in `@context`:

```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://schema.org",
    "https://marketplace.example.com/contexts/marketplace/v1"
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
| tenantType | `https://marketplace.example.com/vocab#tenantType` | Participant type: Employer, Scholarship Admin, Education Institution, Government Service |

## Credential Types

### MarketplaceProfileCredential

Attests that an organization is an approved marketplace participant (employer, scholarship admin, or education institution). Uses schema.org `Organization`.

- **credentialSubject**: `Organization` type with `name`, `email`, `url`, `address`, `industry`, `tenantType`
- **validFrom** / **validUntil**: VCDM 2.0 validity period (not deprecated `issuanceDate`/`expirationDate`)

### JobPostingCredential

Verifiable job listing. Uses schema.org `JobPosting`.

- **credentialSubject**: `JobPosting` type with `title`, `description`, `datePosted`, `validThrough`, `employmentType`, `hiringOrganization`, `jobLocation`, `baseSalary`, `skills`, `qualifications`, `industry`

## Signing

Credentials are signed via the ACA-Py `/vc/sign` endpoint (Ed25519Signature2020, did:key).
