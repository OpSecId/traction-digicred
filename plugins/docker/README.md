This will contain the dockerfile that we will build our acapy + plugins image

Lots to do here to clean up where the plugin code comes from etc...
This uses the plugins/pyproject.toml to specify a new project that includes the (local) plugins as dependencies, should probably pull in versioned ones.

The dockerfile is copying over the local plugins code, but should it? Probably should be pulling in versioned code.

### developer notes

- install python 3.12
- install poetry version 1.8.3

### build and run

**Multitenant agent (innkeeper + marketplace):**
```bash
cd plugins/docker
docker build -f ./Dockerfile --tag traction_plugins ..
docker run -it -p 3000:3000 -p 3001:3001 -p 3002:3002 --rm traction_plugins
```

Admin API: http://localhost:3001 (Swagger: http://localhost:3001/docs)
HTTP transport: http://localhost:3000
WebSocket: ws://localhost:3002

**Test marketplace endpoints:**
```bash
# Create marketplace invitation
curl -X POST http://localhost:3001/marketplace/invitation \
  -H "Content-Type: application/json" \
  -d '{"content_url": "https://marketplace.example.com/embed/channel", "multi_use": true}'

# Analyze transcript
curl -X POST http://localhost:3001/marketplace/analyze-transcript \
  -H "Content-Type: application/json" \
  -d '{"credential_data": {"attributes": [{"name": "Transcript", "value": "[{\"courseName\": \"Math 101\", \"grade\": \"A\"}]"}, {"name": "GPA", "value": "3.8"}]}}'
```

### Run locally (no Docker)

Requires the same package layout as Docker. From repo root:
```bash
cd traction-digicred/plugins
poetry install
# Create traction_plugins layout for plugin loading
mkdir -p /tmp/traction_plugins
cp -r traction_innkeeper/traction_innkeeper /tmp/traction_plugins/traction_innkeeper
cp -r traction_marketplace/traction_marketplace /tmp/traction_plugins/traction_marketplace
touch /tmp/traction_plugins/__init__.py
export PYTHONPATH="/tmp/traction_plugins:$PYTHONPATH"
aca-py start --arg-file docker/default.yml
```
