/**
 * postinstall.js
 * 
 * Patches @expo/cli's externals.js to skip Node.js built-in module names 
 * that contain colons (e.g., node:sea, node:sqlite, node:test) which are 
 * invalid as Windows directory names.
 * 
 * This patch is required when running Node.js v19+ with Expo SDK 50 on Windows.
 * Run: node scripts/postinstall.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/@expo/cli/build/src/start/server/metro/externals.js'
);

const target = `    for (const moduleId of NODE_STDLIB_MODULES){
        const shimDir`;

const replacement = `    for (const moduleId of NODE_STDLIB_MODULES){
        // Skip modules with colons/slashes in their names (invalid Windows path chars - e.g. node:sea, node:sqlite)
        if (moduleId.includes(':') || moduleId.includes('/')) {
            continue;
        }
        const shimDir`;

if (!fs.existsSync(filePath)) {
  console.log('⚠️  externals.js not found — skipping patch');
  process.exit(0);
}

const contents = fs.readFileSync(filePath, 'utf8');

if (contents.includes('Skip modules with colons')) {
  console.log('✅ Expo externals.js already patched — skipping');
  process.exit(0);
}

if (!contents.includes(target)) {
  console.log('⚠️  Target not found in externals.js — patch may not be needed');
  process.exit(0);
}

const patched = contents.replace(target, replacement);
fs.writeFileSync(filePath, patched, 'utf8');
console.log('✅ Patched @expo/cli externals.js for Node.js v19+ Windows compatibility');
