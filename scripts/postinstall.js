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

const cachePath = path.join(
  __dirname,
  '../node_modules/@expo/cli/build/src/api/rest/cache/FileSystemResponseCache.js'
);

// --- Patch externals.js ---
const targetExternals = `    for (const moduleId of NODE_STDLIB_MODULES){
        const shimDir`;

const replacementExternals = `    for (const moduleId of NODE_STDLIB_MODULES){
        // Skip modules with colons/slashes in their names (invalid Windows path chars - e.g. node:sea, node:sqlite)
        if (moduleId.includes(':') || moduleId.includes('/')) {
            continue;
        }
        const shimDir`;

if (fs.existsSync(filePath)) {
  const contents = fs.readFileSync(filePath, 'utf8');
  if (!contents.includes('Skip modules with colons')) {
    if (contents.includes(targetExternals)) {
      const patched = contents.replace(targetExternals, replacementExternals);
      fs.writeFileSync(filePath, patched, 'utf8');
      console.log('✅ Patched @expo/cli externals.js');
    } else {
      console.log('⚠️  Target not found in externals.js — skipping patch');
    }
  } else {
    console.log('✅ Expo externals.js already patched');
  }
} else {
  console.log('⚠️  externals.js not found — skipping patch');
}

// --- Patch FileSystemResponseCache.js for Node 25 ---
const targetCache = `            // Clone the response body stream since we need to read it twice
            const [forSize, forWrite] = response.body.tee();
            // Check if the body is empty by reading the first stream
            const reader = forSize.getReader();
            const { value } = await reader.read();
            reader.releaseLock();
            if (!value || value.length === 0) {
                responseInfo.empty = true;
            } else {
                // Create write stream and pipe response body to file
                const writeStream = _nodefs().default.createWriteStream(paths.body);
                const nodeStream = _nodestream().Readable.fromWeb(forWrite);
                nodeStream.pipe(writeStream);
                // Wait for the stream to finish
                await _nodestream().default.promises.finished(writeStream);
                responseInfo.bodyPath = paths.body;
            }`;

const replacementCache = `            // Node 25 compatibility fix: Avoid tee() which locks streams and causes Body is unusable error
            const bodyBuffer = Buffer.from(await response.arrayBuffer());
            if (bodyBuffer.length === 0) {
                responseInfo.empty = true;
            } else {
                await _nodefs().default.promises.writeFile(paths.body, bodyBuffer);
                responseInfo.bodyPath = paths.body;
            }`;

if (fs.existsSync(cachePath)) {
  const contents = fs.readFileSync(cachePath, 'utf8');
  if (!contents.includes('Node 25 compatibility fix')) {
    if (contents.includes(targetCache)) {
      const patched = contents.replace(targetCache, replacementCache);
      fs.writeFileSync(cachePath, patched, 'utf8');
      console.log('✅ Patched @expo/cli FileSystemResponseCache.js for Node 25 compatibility');
    } else {
      console.log('⚠️  Target not found in FileSystemResponseCache.js — patch may not be needed or already applied');
    }
  } else {
    console.log('✅ FileSystemResponseCache.js already patched');
  }
} else {
  console.log('⚠️  FileSystemResponseCache.js not found — skipping patch');
}

