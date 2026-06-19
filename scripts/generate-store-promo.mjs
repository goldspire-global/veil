/**
 * Generate Chrome/Edge store promo tiles.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repoRoot, 'extension', 'store');
const iconPath = join(repoRoot, 'extension', 'icons', 'icon-128.png');
const psPath = join(repoRoot, 'scripts', 'generate-store-promo.ps1');

const tiles = [
  { name: 'promo-tile-440x280.png', width: 440, height: 280 },
  { name: 'promo-tile-1400x560.png', width: 1400, height: 560 },
];

mkdirSync(outDir, { recursive: true });

for (const tile of tiles) {
  const outPath = join(outDir, tile.name);
  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      psPath,
      '-IconPath',
      iconPath,
      '-OutPath',
      outPath,
      '-Width',
      String(tile.width),
      '-Height',
      String(tile.height),
    ],
    { stdio: 'inherit' },
  );

  if (!existsSync(outPath)) {
    console.error(`Failed to create ${outPath}`);
    process.exit(1);
  }
  console.log(`Created ${outPath}`);
}
