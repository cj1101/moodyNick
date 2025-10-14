const express = require('express');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const {
  getOutlineDefinition,
  setDynamicOutlineDefinition,
  buildDynamicOutlineDefinition,
  dynamicOutlinesReady,
  getAllOutlineEntries,
} = require('../config/productOutlines');

const router = express.Router();
const OUTLINES_DIR = path.join(__dirname, '../generated-outlines');
const STATIC_OUTLINES_DIR = path.join(__dirname, '../../frontend/public/product-outlines');

const PRINTFUL_API_BASE = 'https://api.printful.com';

const GEMINI_IMAGE_ENDPOINT =
  process.env.GEMINI_IMAGE_ENDPOINT ||
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent';
const GEMINI_IMAGE_MODE = (process.env.GEMINI_IMAGE_MODE || 'generatecontent').toLowerCase();
const GEMINI_NEGATIVE_PROMPT =
  process.env.GEMINI_NEGATIVE_PROMPT ||
  'person, human, model, background, color, shading, gradient, texture, realistic, photo, 3d, detailed';
const GEMINI_ASPECT_RATIO = process.env.GEMINI_ASPECT_RATIO || '1:1';
const GEMINI_SAMPLE_COUNT = Number(process.env.GEMINI_SAMPLE_COUNT || '1');

async function fileExists(filePath) {
  try {
    await fsPromises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

async function ensureDirectory(dirPath) {
  await fsPromises.mkdir(dirPath, { recursive: true });
}

async function fetchProductMetadata(productId) {
  const apiKey = process.env.PRINTFUL_API_KEY;
  if (!apiKey) {
    throw new Error('PRINTFUL_API_KEY environment variable is not set');
  }

  const response = await fetch(`${PRINTFUL_API_BASE}/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch product metadata (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (data.code !== 200 || !data.result) {
    throw new Error(`Unexpected product metadata response: ${JSON.stringify(data)}`);
  }

  const product = data.result.product || data.result.sync_product || {};
  const productType = data.result.product_type || data.result.sync_product_type || {};

  return {
    name: product.name || product.title || data.result.name || `Product ${productId}`,
    productType: productType.name || productType.title || '',
  };
}

async function ensureDynamicDefinition(productId, metadataHint) {
  const existing = getOutlineDefinition(productId);
  if (existing) {
    return existing;
  }

  await dynamicOutlinesReady;

  const cached = getOutlineDefinition(productId);
  if (cached) {
    return cached;
  }

  const metadata = metadataHint || (await fetchProductMetadata(productId));
  const definition = buildDynamicOutlineDefinition({
    productId,
    name: metadata.name,
    productType: metadata.productType,
  });

  await setDynamicOutlineDefinition(productId, definition);
  return definition;
}

async function generateOutline(productId, outlineDefinition) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  if (GEMINI_IMAGE_MODE !== 'generatecontent') {
    throw new Error(
      `Unsupported GEMINI_IMAGE_MODE "${GEMINI_IMAGE_MODE}". Expected "generatecontent" for Gemini image generation.`,
    );
  }

  const promptSections = [outlineDefinition.prompt];

  if (GEMINI_ASPECT_RATIO) {
    promptSections.push(`Aspect ratio: ${GEMINI_ASPECT_RATIO}`);
  }

  if (GEMINI_NEGATIVE_PROMPT) {
    promptSections.push(`Avoid: ${GEMINI_NEGATIVE_PROMPT}`);
  }

  if (GEMINI_SAMPLE_COUNT > 1) {
    promptSections.push(`Provide ${GEMINI_SAMPLE_COUNT} distinct variations.`);
  }

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: promptSections.join('\n\n'),
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  };

  const response = await fetch(`${GEMINI_IMAGE_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 404) {
      throw new Error(
        `Gemini endpoint not found (404). Update GEMINI_IMAGE_ENDPOINT/GEMINI_IMAGE_MODE or list models via "curl https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY". Response: ${errorText}`,
      );
    }
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part?.inlineData?.data);

  if (!imagePart) {
    throw new Error('Gemini API did not return inline image data');
  }

  const prediction = imagePart.inlineData.data;

  await ensureDirectory(OUTLINES_DIR);
  const buffer = Buffer.from(prediction, 'base64');
  const outputPath = path.join(OUTLINES_DIR, outlineDefinition.filename);
  await fsPromises.writeFile(outputPath, buffer);

  return {
    pathOnDisk: outputPath,
    relativePath: `/generated-outlines/${outlineDefinition.filename}`,
    source: 'generated',
  };
}

router.get('/status', async (req, res) => {
  try {
    await dynamicOutlinesReady;

    const entries = getAllOutlineEntries();
    const products = [];
    const counts = { generated: 0, static: 0, missing: 0 };

    for (const entry of entries) {
      const { productId, definition, source } = entry;
      const generatedPath = path.join(OUTLINES_DIR, definition.filename);
      const staticPath = path.join(STATIC_OUTLINES_DIR, definition.filename);

      const generatedExists = await fileExists(generatedPath);
      const staticExists = await fileExists(staticPath);

      let status = 'missing';
      let relativePath = null;

      if (generatedExists) {
        status = 'generated';
        relativePath = `/generated-outlines/${definition.filename}`;
      } else if (staticExists) {
        status = 'static';
        relativePath = `/product-outlines/${definition.filename}`;
      }

      if (counts[status] !== undefined) {
        counts[status] += 1;
      }

      const absoluteUrl = relativePath ? `${req.protocol}://${req.get('host')}${relativePath}` : null;

      products.push({
        productId,
        source,
        status,
        filename: definition.filename,
        prompt: definition.prompt,
        relativePath,
        absoluteUrl,
        generated: {
          exists: generatedExists,
          path: generatedExists ? `/generated-outlines/${definition.filename}` : null,
        },
        static: {
          exists: staticExists,
          path: staticExists ? `/product-outlines/${definition.filename}` : null,
        },
      });
    }

    const generatedProductIds = products
      .filter((record) => record.status === 'generated')
      .map((record) => record.productId);
    const staticProductIds = products
      .filter((record) => record.status === 'static')
      .map((record) => record.productId);
    const missingProductIds = products
      .filter((record) => record.status === 'missing')
      .map((record) => record.productId);

    return res.json({
      summary: {
        totalProducts: entries.length,
        generatedCount: counts.generated,
        staticCount: counts.static,
        missingCount: counts.missing,
      },
      products,
      generatedProductIds,
      staticProductIds,
      missingProductIds,
    });
  } catch (error) {
    console.error('Failed to load outline status:', error);
    return res.status(500).json({ message: 'Failed to load outline status', error: error.message });
  }
});

router.get('/:productId', async (req, res) => {
  const { productId } = req.params;
  let outlineDefinition = getOutlineDefinition(productId);

  try {
    if (!outlineDefinition) {
      outlineDefinition = await ensureDynamicDefinition(productId);
    }

    // 1. Check generated outline cache
    const generatedPath = path.join(OUTLINES_DIR, outlineDefinition.filename);
    if (await fileExists(generatedPath)) {
      const relativePath = `/generated-outlines/${outlineDefinition.filename}`;
      const imageUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
      return res.json({ imageUrl, relativePath, source: 'cached' });
    }

    // 2. Check if a manually provided outline exists in the frontend public directory
    const staticPath = path.join(STATIC_OUTLINES_DIR, outlineDefinition.filename);
    if (await fileExists(staticPath)) {
      const relativePath = `/product-outlines/${outlineDefinition.filename}`;
      const imageUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
      return res.json({ imageUrl, relativePath, source: 'static' });
    }

    // 3. Generate outline via Gemini
    const result = await generateOutline(productId, outlineDefinition);
    const imageUrl = `${req.protocol}://${req.get('host')}${result.relativePath}`;

    return res.json({ imageUrl, relativePath: result.relativePath, source: result.source });
  } catch (error) {
    console.error('Error handling outline request:', error);
    return res.status(500).json({ message: 'Failed to obtain product outline', error: error.message });
  }
});

router.post('/batch', async (req, res) => {
  const logPrefix = '[outlines][batch]';
  const batchStart = Date.now();
  try {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ message: 'PRINTFUL_API_KEY environment variable is not set' });
    }

    const body = req.body || {};
    const { cursor = 0, maxPages, dryRun = false } = body;
    const pageLimit = Number.isFinite(maxPages) && Number(maxPages) > 0 ? Number(maxPages) : Infinity;
    let nextCursor = Number(cursor) || 0;
    let pagesProcessed = 0;
    let totalFetched = 0;
    const visitedOffsets = new Set();
    const generated = [];
    const skipped = [];
    const errors = [];
    console.info(`${logPrefix} Starting batch run from cursor ${nextCursor} (maxPages=${pageLimit === Infinity ? 'all' : pageLimit}, dryRun=${dryRun})`);

    while (nextCursor !== null && pagesProcessed < pageLimit) {
      if (visitedOffsets.has(nextCursor)) {
        console.warn(`${logPrefix} Detected repeated cursor ${nextCursor}, aborting to avoid infinite loop.`);
        nextCursor = null;
        break;
      }

      visitedOffsets.add(nextCursor);

      const pageUrl = `${PRINTFUL_API_BASE}/products?offset=${encodeURIComponent(nextCursor)}`;
      console.info(`${logPrefix} Fetching products from ${pageUrl}`);

      const productListResponse = await fetch(pageUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!productListResponse.ok) {
        const errorText = await productListResponse.text();
        return res.status(productListResponse.status).json({
          message: 'Failed to fetch product list',
          error: errorText,
          generated,
          skipped,
          errors,
          nextCursor,
          pagesProcessed,
        });
      }

      const listData = await productListResponse.json();
      if (listData.code !== 200 || !Array.isArray(listData.result)) {
        return res.status(500).json({
          message: 'Unexpected product list response',
          error: listData,
          generated,
          skipped,
          errors,
          nextCursor,
          pagesProcessed,
        });
      }

      const products = listData.result;
      totalFetched += products.length;
      console.info(`${logPrefix} Processing ${products.length} products (offset=${nextCursor})`);

      for (const product of products) {
        const productId = product.id;
        try {
          const definition = await ensureDynamicDefinition(productId, {
            name: product.name,
            productType: product.type,
          });

          const generatedPath = path.join(OUTLINES_DIR, definition.filename);
          if (await fileExists(generatedPath)) {
            skipped.push({ productId, reason: 'already_generated' });
            continue;
          }

          const staticPath = path.join(STATIC_OUTLINES_DIR, definition.filename);
          if (await fileExists(staticPath)) {
            skipped.push({ productId, reason: 'static_outline_available' });
            continue;
          }

          if (dryRun) {
            skipped.push({ productId, reason: 'dry_run' });
            continue;
          }

          const result = await generateOutline(productId, definition);
          generated.push({ productId, relativePath: result.relativePath });
        } catch (error) {
          console.error(`Failed to generate outline for product ${productId}:`, error);
          errors.push({ productId, error: error.message });
        }
      }

      pagesProcessed += 1;

      if (listData.paging && typeof listData.paging.offset === 'number' && typeof listData.paging.limit === 'number') {
        let computedNext = listData.paging.offset + listData.paging.limit;
        if (Number.isFinite(listData.paging.next)) {
          computedNext = listData.paging.next;
        }
        if (listData.paging.total && Number.isFinite(listData.paging.total) && computedNext >= listData.paging.total) {
          nextCursor = null;
        } else if (products.length === 0) {
          nextCursor = null;
        } else {
          nextCursor = computedNext;
        }
      } else if (products.length === 0) {
        nextCursor = null;
      } else {
        nextCursor = null;
      }
    }

    const durationMs = Date.now() - batchStart;
    console.info(
      `${logPrefix} Completed batch run in ${durationMs}ms. Generated=${generated.length}, Skipped=${skipped.length}, Errors=${errors.length}, NextCursor=${nextCursor}`,
    );

    return res.json({
      generated,
      skipped,
      errors,
      nextCursor,
      pagesProcessed,
      totalFetched,
      durationMs,
      dryRun,
      completed: nextCursor === null,
      startCursor: Number(cursor) || 0,
    });
  } catch (error) {
    console.error('[outlines][batch] Batch outline generation failed:', error);
    return res.status(500).json({ message: 'Failed to batch generate outlines', error: error.message });
  }
});

module.exports = router;
