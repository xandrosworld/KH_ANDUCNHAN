import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import phpParser from 'php-parser';

const appRoot = process.cwd();
const targets = [
  path.join(appRoot, 'backend'),
];

const ignoredParts = new Set([
  'node_modules',
  'release',
  'dist',
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredParts.has(entry.name)) walk(fullPath, files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.php')) files.push(fullPath);
  }
  return files;
}

const parser = new phpParser.Engine({
  parser: {
    extractDoc: true,
    php7: true,
    suppressErrors: false,
  },
  ast: {
    withPositions: true,
  },
});

const phpFiles = targets.flatMap((target) => walk(target));
const errors = [];

for (const file of phpFiles) {
  const code = fs.readFileSync(file, 'utf8');
  try {
    parser.parseCode(code, file);
  } catch (error) {
    errors.push(`${path.relative(appRoot, file)}: ${error.message}`);
  }
}

if (errors.length > 0) {
  console.error('PHP syntax parse failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`PHP syntax parse passed for ${phpFiles.length} files.`);
