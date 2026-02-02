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
const publicPath = path.join(rootDir, 'frontend', 'public', 'demo.json');
const embeddedPath = path.join(rootDir, 'frontend', 'src', 'data', 'embeddedDemo.json');

const config = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
const json = JSON.stringify(config, null, 2);
fs.writeFileSync(publicPath, json);
fs.mkdirSync(path.dirname(embeddedPath), { recursive: true });
fs.writeFileSync(embeddedPath, json);
console.log('Embedded demo config to frontend/public/demo.json and frontend/src/data/embeddedDemo.json');
