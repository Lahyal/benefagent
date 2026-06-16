#!/usr/bin/env node
/**
 * Reads .env and writes js/supabase-config.js for the static site + mobile reference.
 * Run: node scripts/generate-supabase-config.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

let env = {};
if (fs.existsSync(envPath)) {
  env = parseEnv(fs.readFileSync(envPath, 'utf8'));
}

const url = env.SUPABASE_URL || 'https://etcgfhmybxkyvxqwowzc.supabase.co';
const anonKey = env.SUPABASE_ANON_KEY || '';

if (!anonKey) {
  console.warn('Warning: SUPABASE_ANON_KEY missing in .env — js/supabase-config.js will have an empty key.');
}

const jsDir = path.join(root, 'js');
fs.mkdirSync(jsDir, { recursive: true });

const contents = `/** Auto-generated — run: node scripts/generate-supabase-config.js */
window.BENEFAGENT_SUPABASE = {
  url: '${url}',
  anonKey: '${anonKey}',
};
`;

fs.writeFileSync(path.join(jsDir, 'supabase-config.js'), contents);

const mobileTs = `/** Auto-generated — run: node scripts/generate-supabase-config.js */
export const SUPABASE_URL = '${url}';
export const SUPABASE_ANON_KEY = '${anonKey}';
`;

fs.writeFileSync(path.join(root, 'mobile/src/lib/supabase.generated.ts'), mobileTs);
console.log('Wrote js/supabase-config.js and mobile/src/lib/supabase.generated.ts');
