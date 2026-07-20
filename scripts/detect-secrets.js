const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const excludedFiles = new Set([
  'app/package-lock.json',
  'package-lock.json',
  '.secretsignore',
  'scripts/detect-secrets.js',
]);

// False positives may be allowlisted in .secretsignore as: path<TAB>exact literal.
// Keep entries narrowly scoped; deleting the entry immediately restores detection.
const ignoredLiterals = new Map();

try {
  for (const [index, rawLine] of readFileSync('.secretsignore', 'utf8')
    .split('\n')
    .entries()) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('\t');
    const file = line.slice(0, separatorIndex).trim();
    const literal = line.slice(separatorIndex + 1).trim();

    if (separatorIndex < 1 || !literal) {
      process.stderr.write(
        `.secretsignore line ${index + 1} must use: path<TAB>exact literal\n`,
      );
      process.exit(2);
    }

    const literals = ignoredLiterals.get(file) ?? [];
    literals.push(literal);
    ignoredLiterals.set(file, literals);
  }
} catch (error) {
  if (error.code !== 'ENOENT') {
    process.stderr.write(`Unable to read .secretsignore: ${error.message}\n`);
    process.exit(2);
  }
}

const signatures = [
  {
    name: 'Google API key',
    pattern: new RegExp('AI' + 'za[0-9A-Za-z_-]{20,}'),
  },
  {
    name: 'OpenAI-style API key',
    pattern: new RegExp('s' + 'k-[0-9A-Za-z_-]{20,}'),
  },
  {
    name: 'credential assignment',
    pattern:
      /(?:api[_-]?key|secret|access[_-]?token|auth[_-]?token|private[_-]?key)\s*[:=]\s*["'][^"'\s]{20,}["']/i,
  },
  {
    name: 'private key block',
    pattern: new RegExp('-----BEGIN ' + '(?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
  },
  {
    name: 'high-entropy token-like string',
    pattern:
      /["'](?=[A-Za-z0-9_=-]{40,}["'])(?=[^"']*[A-Z])(?=[^"']*[a-z])(?=[^"']*\d)[A-Za-z0-9_=-]{40,}["']/,
  },
];

const stagedFiles = execFileSync(
  'git',
  ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean)
  .filter((file) => !excludedFiles.has(file));

const findings = [];

for (const file of stagedFiles) {
  let diff;

  try {
    diff = execFileSync(
      'git',
      ['diff', '--cached', '--unified=0', '--no-color', '--', file],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
    );
  } catch (error) {
    process.stderr.write(`Secret scan failed for ${file}: ${error.message}\n`);
    process.exit(2);
  }

  const addedLines = diff
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1));

  for (const [index, line] of addedLines.entries()) {
    for (const signature of signatures) {
      const isExplicitlyIgnored = (ignoredLiterals.get(file) ?? []).some(
        (literal) => line.includes(literal),
      );

      if (!isExplicitlyIgnored && signature.pattern.test(line)) {
        findings.push(`${file} (added line ${index + 1}): ${signature.name}`);
      }
    }
  }
}

if (findings.length > 0) {
  process.stderr.write('Potential secrets detected in staged changes:\n');
  process.stderr.write(`${findings.map((finding) => `- ${finding}`).join('\n')}\n`);
  process.stderr.write('Remove the secret and load it from an environment variable.\n');
  process.exit(1);
}

process.stdout.write('Secret scan passed.\n');
