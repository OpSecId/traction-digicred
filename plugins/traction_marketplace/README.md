# Traction Marketplace Plugin

ACA-Py plugin for the DigiCred Marketplace, providing:

1. **Marketplace OOB Invitation** — Create out-of-band invitations with `goal_code: connection.channel.marketplace` and channel metadata attachment (`application/marketplace-channel+json`)
2. **Transcript Analysis** — Analyze transcript credentials (extract skills, courses, GPA) for job matching
3. **Action Menu** — Send action menu to connected holders (e.g. "Share transcript", "Browse jobs")

## Installation

```bash
pip install -e .
```

## Run with Docker

The marketplace plugin runs as part of the multitenant agent (with innkeeper). From `plugins/docker`:

```bash
docker build -f ./Dockerfile --tag traction_plugins ..
docker run -it -p 3000:3000 -p 3001:3001 -p 3002:3002 --rm traction_plugins
```

- Admin API: http://localhost:3001
- Swagger: http://localhost:3001/docs
- HTTP transport: http://localhost:3000

## Configuration

```yaml
plugin:
  - traction_plugins.traction_marketplace.v1_0

plugin-config-value:
  - traction_marketplace.content_url=https://marketplace.example.com/embed/channel
  - traction_marketplace.label=Apply Utopia
  - traction_marketplace.image_url=https://marketplace.example.com/marketplace.png
```

## API Endpoints

- `POST /marketplace/invitation` — Create marketplace channel OOB invitation
- `POST /marketplace/analyze-transcript` — Analyze transcript credential data
- `POST /marketplace/action-menu/{connection_id}` — Send action menu to connection
