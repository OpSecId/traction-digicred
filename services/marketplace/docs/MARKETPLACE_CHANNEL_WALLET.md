# Marketplace Channel — Wallet Implementation Guide

This document describes how to implement the marketplace channel in the DigiCred Bifold wallet, enabling users to browse jobs and opportunities through a connection (channel) that loads content from the marketplace PWA.

---

## 1. Concepts

### 1.1 Channels vs Connections

In the DigiCred wallet, a **channel** is a connection with another agent. When you connect with an agent, that forms a channel through which the agent can provide workflows (credential offers, proof requests, action menus, etc.).

### 1.2 Channel Types

Not all channels are the same:

| Channel Type | Purpose | UI | Content Source |
|--------------|---------|-----|----------------|
| **Issuer** (e.g. school) | Issues credentials (transcripts, diplomas) | Chat + credential workflows | DIDComm messages |
| **Marketplace** | Browse jobs, scholarships; share credentials for matching | WebView loading PWA | PWA URL |
| **Message** | Generic chat/credential exchange | Chat | DIDComm messages |

The marketplace channel is different: instead of a chat interface, the wallet loads the marketplace PWA in a WebView. Workflows (e.g. presentation requests for "Share my transcript") still flow over the same DIDComm connection.

### 1.3 Channel Type Identifier

Use a hierarchical type identifier:

```
connection.channel.marketplace
connection.channel.issuer
connection.channel.message
```

---

## 2. Communicating Channel Type and Content URL

### 2.1 Out-of-Band (OOB) Invitation

When the user scans a QR code or opens a connection link, the OOB invitation carries:

- **`handshake_protocols`** — Initiates the DID Exchange handshake (e.g. `["https://didcomm.org/didexchange/1.0"]`)
- **`services`** — Endpoint(s) for the wallet to respond
- **`goal_code`** — Channel type: `connection.channel.marketplace`
- **`goal`** — Human-readable description: `"Browse jobs and opportunities from Apply Utopia"`
- **Attachment** — Channel metadata including the content URL

### 2.2 OOB Invitation Format

The OOB invitation initiates the **DID Exchange handshake** (Aries RFC 0023) via `handshake_protocols` and `services` — per RFC 0434. The handshake is a sequence of DIDComm messages (request/response) that establishes the connection. It is not an attachment; it is the protocol flow triggered by the OOB message itself.

**Flow:** OOB invitation → wallet accepts → DID Exchange handshake (request/response) → connection established → channel metadata stored

The OOB message uses the standard RFC 0434 structure: `handshake_protocols` and `services` trigger the handshake. Channel metadata is carried in a single attachment.

```json
{
  "@type": "https://didcomm.org/out-of-band/1.0/invitation",
  "@id": "<unique-id>",
  "label": "Apply Utopia",
  "goal_code": "connection.channel.marketplace",
  "goal": "Browse jobs and opportunities from Apply Utopia",
  "handshake_protocols": ["https://didcomm.org/didexchange/1.0"],
  "services": ["<DID or inline service block>"],
  "attachments": [
    {
      "id": "digicred-channel-metadata",
      "media_type": "application/digicred-channel+json",
      "data": {
        "base64": "<base64-encoded channel metadata payload>"
      }
    }
  ]
}
```

| Field / Item | Purpose |
|--------------|---------|
| `handshake_protocols` | Initiates the DID Exchange handshake (not an attachment) |
| `services` | Endpoint(s) for the wallet to send the handshake response |
| `attachments` (digicred-channel-metadata) | Channel type and content URL for marketplace channels |

### 2.3 Channel Metadata Attachment Payload

The attachment payload (before base64 encoding):

```json
{
  "channelType": "connection.channel.marketplace",
  "contentUrl": "https://marketplace.example.com/embed/channel",
  "version": "1.0"
}
```

| Field | Description |
|-------|-------------|
| `channelType` | Channel type identifier |
| `contentUrl` | URL from which the wallet loads marketplace content (WebView) |
| `version` | Schema version for future compatibility |

### 2.4 Fallback: goal as URL

If the attachment is missing, the wallet may treat `goal` as the content URL when `goal_code` is `connection.channel.marketplace`. This is less conventional but allows simpler invitations.

---

## 3. How Workflows Fit

| Concern | Mechanism |
|---------|-----------|
| **Channel type** | `goal_code` in OOB invitation |
| **Content URL** | Attachment `application/digicred-channel+json` |
| **Marketplace UI** | WebView loads `contentUrl` |
| **Presentation requests** | Workflows over the DIDComm connection |
| **Other interactions** | Workflows (BasicMessage, Action Menu, credential offers, etc.) |

**Flow:**

1. User scans OOB invitation → wallet parses `goal_code` and attachment.
2. Wallet stores `channelType` and `contentUrl` in connection metadata.
3. User opens channel → wallet loads WebView from `contentUrl`.
4. Marketplace agent sends workflows (e.g. "Share transcript" presentation request) over the connection.
5. Wallet handles workflows natively (credential picker, proof flow, etc.).

---

## 4. Wallet Implementation Steps

### 4.1 Parse OOB Invitation

When receiving an OOB invitation:

1. Read `goal_code` — if `connection.channel.marketplace`, treat as marketplace channel.
2. Look for attachment with `media_type: application/digicred-channel+json`.
3. Decode base64 payload and extract `contentUrl`.
4. Store in connection metadata when connection is created:
   - `connection.metadata.set('channelType', 'connection.channel.marketplace')`
   - `connection.metadata.set('contentUrl', contentUrl)`

### 4.2 Connection Metadata Keys

| Key | Value | When Set |
|-----|-------|----------|
| `channelType` | `connection.channel.marketplace` | On OOB parse |
| `contentUrl` | `https://...` | On OOB parse (from attachment) |

### 4.3 Route by Channel Type

When the user taps a connection in Home/Contacts:

```ts
const channelType = connection.metadata.get('channelType') ?? 'connection.channel.message'

if (channelType === 'connection.channel.marketplace') {
  navigation.navigate(Screens.MarketplaceChannel, { connectionId, contentUrl })
} else {
  navigation.navigate(Screens.Chat, { connectionId })
}
```

### 4.4 Marketplace Channel Screen

Create a new screen (e.g. `MarketplaceChannelScreen.tsx`):

- Use `react-native-webview` to load `contentUrl`.
- Wrap in DigiCred layout (gradient background, safe areas).
- Handle loading and error states.
- Support back navigation (WebView `goBack` when possible, else stack pop).

### 4.5 Config Fallback

For connections created before channel metadata was supported, use config:

```ts
// config
marketplaceConnectionIds?: string[]
marketplaceContentUrl?: string  // default URL if not in connection metadata
```

If `connectionId` is in `marketplaceConnectionIds` and `contentUrl` is missing from metadata, use `marketplaceContentUrl`.

### 4.6 PostMessage Bridge (Optional)

For "Share transcript" from the WebView:

1. PWA posts message when user taps "Share my skills".
2. Wallet listens via WebView `onMessage`.
3. Wallet opens credential picker, sends selected credential (or presentation) back via `injectJavaScript` or `postMessage`.
4. PWA receives credential and continues flow.

---

## 5. Marketplace PWA Requirements

### 5.1 Embed Route

Create a channel-only route (e.g. `/embed/channel`) that:

- Renders only channel content (Discovery, Scholarships, Services, Education, Job detail).
- Hides header, footer, and other marketplace chrome.
- Accepts optional query params: `theme`, `apiBase`.

### 5.2 OOB Invitation Generation

The marketplace backend (or tenant onboarding flow) must generate OOB invitations that include:

- `handshake_protocols: ["https://didcomm.org/didexchange/1.0"]` and `services` (to initiate the DID Exchange handshake)
- `goal_code: "connection.channel.marketplace"`
- `goal`: Human-readable description
- Attachment with `application/digicred-channel+json` containing `contentUrl`

---

## 6. Considerations

### 6.1 Unknown goal_code — Refuse or Accept?

**Question:** Should the wallet refuse OOB invitations that lack a known `goal_code`?

**Options:**

| Approach | Pros | Cons |
|----------|------|------|
| **Refuse unknown** | Prevents unsupported channel types; forces explicit opt-in | May reject valid invitations from future/legacy agents |
| **Accept unknown** | Backward compatible; treats as `connection.channel.message` | User may connect to agents with unexpected behaviour |
| **Prompt user** | User decides whether to proceed | Extra friction; user may not understand |

**Recommendation:** Document a wallet policy (e.g. configurable `rejectUnknownGoalCodes: boolean`). Default: treat unknown `goal_code` as `connection.channel.message` for compatibility; strict deployments may refuse.

### 6.2 Normative Requirements per goal_code

Different `goal_code` values impose different requirements on `goal` and attachments. The wallet should validate these before proceeding.

| goal_code | goal requirement | Additional validation |
|-----------|------------------|------------------------|
| `connection.channel.marketplace` | Must be a valid URL that returns loadable content (or provided via attachment `contentUrl`) | See below |
| `connection.channel.issuer` | Human-readable description (optional) | — |
| `connection.channel.message` | Human-readable description (optional) | — |

**Marketplace-specific validation:**

For `connection.channel.marketplace`, the wallet may enforce:

1. **Content URL** — `goal` or attachment `contentUrl` must be a reachable URL that returns HTML/JS (the PWA).
2. **Verification endpoint** — The marketplace URL may support a query parameter that returns a verifiable credential attesting that the endpoint is a legitimate marketplace. Example:
   ```
   GET https://marketplace.example.com/embed/channel?vc=1
   → Returns: Verifiable Credential (JWT or JSON-LD) with claims such as:
     - type: "DigiCredMarketplace"
     - issuer: trusted DID
     - marketplaceUrl, tenantId, etc.
   ```
3. **Wallet behaviour** — Before loading the WebView, the wallet may:
   - Fetch `{contentUrl}?vc=1` (or similar)
   - Verify the returned credential (signature, issuer in trust registry)
   - Refuse to load if verification fails

This adds a layer of assurance that the user is connecting to a recognized marketplace, not a phishing site.

---

## 7. Summary

| Component | Responsibility |
|-----------|-----------------|
| **Marketplace** | Generate OOB with `handshake_protocols`, `services`, `goal_code`, `goal`, and channel metadata attachment; expose `/embed/channel` route; optionally support `?vc=1` for verification credential |
| **Wallet** | Parse OOB, validate per goal_code, store `channelType` and `contentUrl`, route marketplace connections to WebView screen; optionally verify marketplace credential |
| **Workflows** | Flow over the connection as usual (presentation requests, etc.) |

---

## 8. References

- Aries RFC 0434: Out-of-Band Invitations
- Bifold: `packages/core/src/hooks/useConnectionCapabilities.ts`
- Bifold: `samples/app/digicred/` (DigiCred custom screens)
- Marketplace PWA: `traction-digicred/services/marketplace/frontend/`
