# Security Policy

## Supported Versions

This is a demo/reference implementation. Security updates are applied as needed.

## Security Considerations

### Before Publishing / Deployment

1. **No secrets in config** – Never commit API keys, tokens, or credentials to `config.json` or any config file. Use environment variables for secrets.

2. **CORS** – In production, set the `CORS_ORIGIN` environment variable to your allowed frontend origin(s), e.g.:
   ```bash
   CORS_ORIGIN=https://your-marketplace.com
   ```
   Multiple origins: `CORS_ORIGIN=https://app.example.com,https://admin.example.com`

3. **Demo data** – `config/demo.yaml` contains sample personas and credentials (e.g. "John Doe"). Replace or remove before using with real users.

4. **HTTPS** – PWAs require HTTPS. Serve over TLS in production.

5. **Local overrides** – Use `config.local.json` for local secrets; it is gitignored.

6. **Rate limiting** – Auth endpoints (tenant-login, innkeeper-login) are limited to 15 attempts per 15 minutes per IP. Tenant request submission is limited to 30 per 15 minutes. Adjust via environment if needed.

7. **Request size** – JSON body limit is 100kb to mitigate large-payload DoS.

8. **Input validation** – Tenant requests are validated for email format, URL format (website), tenancy type, and field length limits. Trust registry logo/website URLs must be valid http/https.

### Reporting a Vulnerability

If you discover a security issue, please report it responsibly rather than opening a public issue.
