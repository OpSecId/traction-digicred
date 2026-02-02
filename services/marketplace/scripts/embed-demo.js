#!/usr/bin/env node
/**
 * Embeds demo.yaml as JSON into frontend/public for static deployment.
 * Ensures sample data is available when the API server is not running.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const rootDir = path.join(__dirname, '..');
const yamlPath = path.join(rootDir, 'config', 'demo.yaml');
const jsonPath = path.join(rootDir, 'frontend', 'public', 'demo.json');

const config = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2));
console.log('Embedded demo config to frontend/public/demo.json');
