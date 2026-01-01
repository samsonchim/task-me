import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const input = path.join(projectRoot, 'assets', 'taskme.png');
const output = path.join(projectRoot, 'assets', 'taskme-icon.png');

if (!fs.existsSync(input)) {
  console.error(`Missing input file: ${input}`);
  process.exit(1);
}

const image = sharp(input, { failOn: 'none' });
const meta = await image.metadata();

if (!meta.width || !meta.height) {
  console.error('Could not read image dimensions.');
  process.exit(1);
}

const size = Math.max(meta.width, meta.height);
const padLeft = Math.floor((size - meta.width) / 2);
const padRight = size - meta.width - padLeft;
const padTop = Math.floor((size - meta.height) / 2);
const padBottom = size - meta.height - padTop;

const extendedBuffer = await image
  .extend({
    top: padTop,
    bottom: padBottom,
    left: padLeft,
    right: padRight,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp(extendedBuffer)
  .resize(1024, 1024, { fit: 'fill' })
  .png()
  .toFile(output);

console.log(`Wrote ${path.relative(projectRoot, output)} (1024x1024)`);
