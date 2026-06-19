import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(repoRoot, '.env');

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

if (!existsSync(envPath)) {
  console.error(`Missing ${envPath}`);
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, 'utf8'));
const keys = [
  'DATABASE_URL',
  'DIRECT_URL',
  'CORS_ALLOW_ORIGINS',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID_TEAM_ANNUAL',
  'STRIPE_PRICE_ID_TEAM_MONTHLY',
  'PLATFORM_OPS_TOKEN',
  'OPS_CLIENT_INGEST_KEY',
  'OPS_ALERT_WEBHOOK_TYPE',
  'OPS_ALERT_WEBHOOK_URL',
  'LEARNING_BUNDLE_SECRET',
  'LEARNING_AUTO_TRAIN',
  'VEIL_EARLY_ACCESS',
];

for (const key of keys) {
  const value = env[key];
  if (!value) {
    console.log(`skip ${key} (not in .env)`);
    continue;
  }
  execSync(`npx @railway/cli variables --set ${JSON.stringify(`${key}=${value}`)}`, {
    stdio: 'inherit',
    cwd: repoRoot,
  });
  console.log(`set ${key}`);
}

console.log('Railway variables synced. Redeploy if the service does not restart automatically.');
