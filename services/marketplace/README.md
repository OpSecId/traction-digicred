# Apply Utopia Marketplace

A mobile-first PWA for job discovery and employer onboarding. Built with Vue 3, Vite, and DigiCred branding.

## Features

- **Discovery** – Browse jobs by category with horizontal scrolling cards
- **Recommendations** – Share transcript credentials for personalized job matching
- **Employer onboarding** – Employers can register and post jobs
- **Applicant management** – View and manage applicants per job
- **Join channel** – Anonymous connection with employers

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server (frontend + API)
npm run dev
```

- Frontend: http://localhost:5175
- API: http://localhost:5174

## Project Structure

```
marketplace/
├── config/
│   └── trust-registry.yaml # Trust registries
├── frontend/               # Vue 3 + Vite PWA
├── src/
│   └── server.ts          # Express API server
├── scripts/
│   └── deploy.sh          # Build script
└── CONFIG.md              # Configuration guide
```

## Configuration

See [CONFIG.md](CONFIG.md) for runtime config, PWA settings, and deployment.

## Security

See [SECURITY.md](SECURITY.md) for security considerations before deployment.

## License

See repository root for license information.
