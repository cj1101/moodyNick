/* eslint-disable no-console */
/**
 * Seed the Artwork collection using the files in /art/backgroundTransparent.
 *
 * Usage:
 *   node scripts/seedArtwork.js
 *
 * Requirements:
 *   - DATABASE_URL environment variable must be set (Mongo connection string)
 *   - PUBLIC_URL optional (defaults to http://localhost:5000)
 *
 * The script is idempotent – it will skip any artwork documents that
 * already exist with the same imageUrl.
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Artwork = require('../models/Artwork');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const PUBLIC_URL =
  process.env.PUBLIC_URL ||
  process.env.API_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.moodyart.shop'
    : 'http://localhost:5000');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Update backend/.env or environment variables.');
  process.exit(1);
}

const ART_DIR = path.join(__dirname, '..', '..', 'art', 'backgroundTransparent');

async function main() {
  if (!fs.existsSync(ART_DIR)) {
    console.error(`❌ Artwork directory not found at ${ART_DIR}`);
    process.exit(1);
  }

  const fileNames = fs
    .readdirSync(ART_DIR)
    .filter((name) => /\.(png|jpg|jpeg|gif)$/i.test(name));

  if (!fileNames.length) {
    console.log('ℹ️ No artwork files found to seed.');
    process.exit(0);
  }

  console.log(`🔗 Connecting to MongoDB... (${DATABASE_URL.split('@').pop()})`);
  await mongoose.connect(DATABASE_URL, {
    serverSelectionTimeoutMS: 10_000,
  });

  console.log(`📁 Found ${fileNames.length} artwork files. Seeding...`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const fileName of fileNames) {
    const imageUrl = `/art/backgroundTransparent/${fileName}`;
    const absoluteUrl = `${PUBLIC_URL}${imageUrl}`;

    // Avoid duplicates: check for existing doc matching either relative or absolute URL
    const existing = await Artwork.findOne({
      imageUrl: { $in: [imageUrl, absoluteUrl] },
    }).lean();

    if (existing) {
      skippedCount += 1;
      continue;
    }

    await Artwork.create({
      imageUrl,
      tags: [],
    });
    createdCount += 1;
  }

  console.log(`✅ Done. Created ${createdCount} documents, skipped ${skippedCount}.`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Seeding failed:', err);
  try {
    await mongoose.disconnect();
  } catch (disconnectErr) {
    console.error('Failed to disconnect mongoose:', disconnectErr);
  }
  process.exit(1);
});

