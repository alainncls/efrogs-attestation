import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const rootPackageJson = JSON.parse(
  await readFile(new URL('../../../package.json', import.meta.url), 'utf8'),
);
const deployScript = await readFile(
  new URL('../scripts/deployEFrogsPortal.ts', import.meta.url),
  'utf8',
);

assert.equal(
  rootPackageJson.scripts.preinstall,
  undefined,
  'preinstall must not execute remote package-manager guard code',
);

assert.match(
  deployScript,
  /PRIVATE_KEY must be a valid 32-byte hex string/,
  'PRIVATE_KEY validation must use a redacted error message',
);

assert.doesNotMatch(
  deployScript,
  /requireHex\(process\.env\.PRIVATE_KEY/,
  'PRIVATE_KEY must not use the generic hex validator that includes raw input in errors',
);

assert.doesNotMatch(
  deployScript,
  /PRIVATE_KEY[^`'"]*got:\s*\$\{value\}/s,
  'PRIVATE_KEY validation must not include the submitted value in errors',
);
