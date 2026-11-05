// Writes copies of the admission letters with identifying details blurred to images/blurred/:
// student name, passport/application number, country, and every mention of the school.
// Regions are [left, top, width, height] in source pixels.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

// Jinggangshan letters share one template; only the vertical offset differs.
const jinggangshan = (dy, dearWidth) => [
  [255, 80 + dy, 640, 160],      // letterhead: crest + school name
  [175, 362 + dy, dearWidth, 46], // name + passport + country
  [670, 450 + dy, 375, 34],      // "Jinggangshan University (JGSU)" in first paragraph
  [285, 665 + dy, 240, 34],      // "Jingangshan University" in registration line
  [295, 840 + dy, 575, 225],     // watermark arc with school name
  [125, 1100 + dy, 255, 200],    // seal + signature block
  [85, 1388 + dy, 1000, 70],     // footer address and contacts
];

const regions = {
  proof:  jinggangshan(0, 470),
  proof3: jinggangshan(-8, 560),
  proof4: jinggangshan(-26, 520),
  proof1: [                       // Jilin University
    [355, 20, 450, 170],          // letterhead
    [118, 176, 250, 40],          // nationality
    [890, 198, 140, 36],          // application no.
    [165, 314, 365, 44],          // name
    [775, 466, 180, 36],          // "Jilin University" in body
    [118, 648, 850, 186],         // beneficiary + bank details
    [585, 1014, 195, 36],         // school email
    [635, 1095, 340, 240],        // seal + signature block
    [118, 1394, 570, 38],         // note email + website
    [118, 1432, 925, 135],        // footer address
  ],
  proof2: [                       // Jiangxi University of Chinese Medicine
    [120, 65, 930, 130],          // letterhead
    [245, 385, 680, 56],          // school name in title
    [240, 554, 780, 46],          // name (line 1)
    [150, 598, 180, 42],          // name (line 2)
    [625, 844, 395, 38],          // school name in body (line 1)
    [150, 882, 150, 38],          // school name in body (line 2)
    [380, 1030, 360, 60],         // watermark text "...University of Chinese"
    [150, 1065, 520, 260],        // seal + signature block
    [115, 1405, 940, 115],        // footer address
  ],
  proof5: [                       // Harbin Institute of Technology, Shenzhen
    [705, 50, 450, 100],          // letterhead
    [130, 138, 450, 122],         // name, nationality, passport, application ID
    [183, 422, 350, 34],          // name in greeting
    [232, 493, 556, 32],          // school name in first paragraph
    [133, 880, 85, 32],           // "HITSZ" before scholarship
    [698, 1028, 84, 32],          // "HITSZ" in reminder (line 3)
    [318, 1086, 74, 32],          // "HITSZ" in reminder (line 4)
    [145, 1325, 270, 260],        // seal
  ],
};

// Letters with a light-grey watermark of the school name: pixels lighter than this
// threshold are turned white, which removes the watermark but keeps the dark body text.
const whiten = { proof5: 175 };

mkdirSync('images/blurred', { recursive: true });

for (const [name, boxes] of Object.entries(regions)) {
  let src = `images/${name}.jpg`;
  const { width: W, height: H } = await sharp(src).metadata();
  if (whiten[name]) {
    const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 3) {
      if (Math.min(data[i], data[i + 1], data[i + 2]) > whiten[name]) data[i] = data[i + 1] = data[i + 2] = 255;
    }
    src = await sharp(data, { raw: info }).png().toBuffer();
  }
  const patches = await Promise.all(boxes.map(async ([left, top, width, height]) => {
    // Clamp to the image and blur harder for tall regions so large lettering can't be read.
    left = Math.max(0, left); top = Math.max(0, top);
    width = Math.min(width, W - left); height = Math.min(height, H - top);
    const sigma = Math.max(14, height / 5);
    return { input: await sharp(src).extract({ left, top, width, height }).blur(sigma).toBuffer(), left, top };
  }));
  await sharp(src).composite(patches).jpeg({ quality: 82 }).toFile(`images/blurred/${name}.jpg`);
  console.log('blurred', name);
}
