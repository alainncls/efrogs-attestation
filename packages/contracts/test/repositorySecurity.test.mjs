import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootPackageJson = JSON.parse(
  await readFile(new URL('../../../package.json', import.meta.url), 'utf8'),
);
const deployScript = await readFile(
  new URL('../scripts/deployEFrogsPortal.ts', import.meta.url),
  'utf8',
);
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

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

const malformedSource = resolve(
  repositoryRoot,
  'packages/frontend/src',
  `format-negative-control-${process.pid}.ts`,
);
try {
  await writeFile(malformedSource, 'const formattingControl = {answer:42}\n');
  const formatRun = spawnSync('pnpm', ['format'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    timeout: 120_000,
  });
  const output = `${formatRun.stdout ?? ''}\n${formatRun.stderr ?? ''}`;
  assert.notEqual(
    formatRun.status,
    0,
    'the repository format command must reject malformed source',
  );
  assert.ok(
    output.includes(basename(malformedSource)),
    'the format failure must identify the malformed first-party file',
  );
} finally {
  await rm(malformedSource, { force: true });
}
