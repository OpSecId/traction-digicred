import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

const app = express();
const PORT = process.env.PORT || 5174;

// CORS: set CORS_ORIGIN env (comma-separated) to restrict origins in production
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((o) => o.trim()) } : {}));
app.use(express.json());

// Serve demo config from YAML
app.get('/api/config/demo', (_req, res) => {
  try {
    const configPath = path.join(__dirname, '../config/demo.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents);
    res.json(config);
  } catch (err) {
    console.error('Error loading demo config:', err);
    res.status(500).json({ error: 'Failed to load demo configuration' });
  }
});

// Get credentials for presentation request (demo: student's transcript-type credentials only)
app.get('/api/presentation-request/credentials', (_req, res) => {
  try {
    const configPath = path.join(__dirname, '../config/demo.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as {
      personas: Array<{
        type: string;
        credentials?: Array<{
          id: string;
          type: string;
          name: string;
          establishmentName?: string;
          image?: string;
          logo?: string;
          credentialSubject?: unknown;
        }>;
      }>;
    };
    const student = (config.personas || []).find((p) => p.type === 'Student');
    const raw = (student?.credentials || []).filter(
      (c) => c.type && c.type.toLowerCase().includes('transcript')
    );
    const credentials = raw.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      establishmentName: c.establishmentName,
      backgroundImage: c.image,
      logo: c.logo,
      credentialSubject: c.credentialSubject,
    }));
    res.json({ credentials });
  } catch (err) {
    console.error('Error loading credentials:', err);
    res.status(500).json({ error: 'Failed to load credentials' });
  }
});

// Get recommendations based on transcript/presentation
// In production: receives presentation proof, analyzes transcript credential, returns matching jobs
app.post('/api/recommendations', (_req, res) => {
  try {
    const configPath = path.join(__dirname, '../config/demo.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as {
      personas: Array<{
        id: string;
        type: string;
        name: string;
        image?: string;
        logo?: string;
        jobPostings: Array<Record<string, unknown>>;
      }>;
    };
    const allJobs: Array<Record<string, unknown>> = [];
    for (const persona of config.personas || []) {
      if (persona.type === 'Employer' && persona.jobPostings) {
        for (const job of persona.jobPostings) {
          allJobs.push({
            ...job,
            employerId: persona.id,
            employerName: persona.name,
            employerImage: persona.image,
            employerLogo: persona.logo,
          });
        }
      }
    }
    const featured = allJobs.filter((j) => j.featured);
    const jobs = featured.length > 0 ? featured : allJobs.slice(0, 8);
    res.json({ jobs });
  } catch (err) {
    console.error('Error getting recommendations:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Serve static frontend in production
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Marketplace server running at http://0.0.0.0:${PORT}`);
});
