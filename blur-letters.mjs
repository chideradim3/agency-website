// Writes copies of the admission letters with personal details blurred to images/blurred/.
// Regions are [left, top, width, height] in source pixels.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const regions = {
  proof:  [[175, 362, 310, 46]],                       // name + passport
  proof1: [[165, 314, 365, 44], [890, 198, 140, 36]],  // name, application no.
  proof2: [[240, 554, 780, 46], [150, 598, 180, 42]],  // name (two lines)
  proof3: [[175, 348, 420, 46]],                       // name + passport
  proof4: [[175, 332, 365, 46]],                       // name + passport
};

mkdirSync('images/blurred', { recursive: true });

for (const [name, boxes] of Object.entries(regions)) {
  const src = `images/${name}.jpg`;
  const patches = await Promise.all(boxes.map(async ([left, top, width, height]) => ({
    input: await sharp(src).extract({ left, top, width, height }).blur(14).toBuffer(),
    left, top,
  })));
  await sharp(src).composite(patches).jpeg({ quality: 82 }).toFile(`images/blurred/${name}.jpg`);
  console.log('blurred', name);
}
