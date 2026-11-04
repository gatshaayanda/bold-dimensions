import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "public/brand/bold-dimensions-logo.jpg");
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const sourceBytes = await fs.readFile(source);
const sourceMetadata = await sharp(sourceBytes).metadata();

if (sourceMetadata.format !== "jpeg" || !sourceMetadata.width || !sourceMetadata.height) {
  throw new Error("PWA icon source public/jts-logo.svg is not a readable JPEG image.");
}

for (const size of [192, 512]) {
  const target = path.join(root, `public/icon-${size}.png`);
  const temporary = target + ".generated";

  await sharp(sourceBytes)
    .resize(size, size, { fit: "contain", background: "#07152D" })
    .png({ compressionLevel: 9 })
    .toFile(temporary);
  await fs.rename(temporary, target);

  const outputBytes = await fs.readFile(target);
  const outputMetadata = await sharp(outputBytes).metadata();
  if (
    !outputBytes.subarray(0, 8).equals(pngSignature) ||
    outputMetadata.format !== "png" ||
    outputMetadata.width !== size ||
    outputMetadata.height !== size
  ) {
    throw new Error(`Generated icon-${size}.png failed PNG format/dimension verification.`);
  }
  console.log(`Generated and verified public/icon-${size}.png (${size}x${size} PNG).`);
}
