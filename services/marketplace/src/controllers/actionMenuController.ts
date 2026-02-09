/**
 * Action menu config - admin-editable. Stored in YAML.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface ActionMenuConfig {
  title: string;
  description: string;
  items: Array<{ title: string; description?: string }>;
  /** Credential types to request in presentation (from credential analysis). Order matters. */
  presentationRequestCredentialTypes?: string[];
}

const DEFAULT_CONFIG: ActionMenuConfig = {
  title: 'Share transcript',
  description: 'Share your transcript for job matching',
  items: [
    { title: 'Share transcript', description: 'Share your transcript credential for job matching' },
    { title: 'Browse jobs', description: 'Discover jobs that match your skills' },
  ],
  presentationRequestCredentialTypes: [],
};

function getConfigPath(): string {
  const candidates = [
    path.join(__dirname, '../../config/action-menu.yaml'),
    path.join(process.cwd(), 'config/action-menu.yaml'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

export function getActionMenuConfig(): ActionMenuConfig {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const contents = fs.readFileSync(configPath, 'utf8');
      const data = yaml.load(contents) as Partial<ActionMenuConfig>;
  return {
    ...DEFAULT_CONFIG,
    ...data,
    items: data.items ?? DEFAULT_CONFIG.items,
    presentationRequestCredentialTypes: data.presentationRequestCredentialTypes ?? DEFAULT_CONFIG.presentationRequestCredentialTypes,
  };
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_CONFIG;
}

export function updateActionMenuConfig(config: Partial<ActionMenuConfig>): ActionMenuConfig {
  const configPath = getConfigPath();
  const merged: ActionMenuConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    items: config.items ?? DEFAULT_CONFIG.items,
    presentationRequestCredentialTypes: config.presentationRequestCredentialTypes ?? DEFAULT_CONFIG.presentationRequestCredentialTypes,
  };
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, yaml.dump(merged), 'utf8');
  return merged;
}
