const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

const DYNAMIC_OUTLINES_FILE = path.join(__dirname, 'dynamic-product-outlines.json');

const productOutlines = {
  '71': {
    filename: 'unisex-staple-tshirt.png',
    prompt:
      'Simple black outline silhouette of a unisex crew neck t-shirt, front view, centered, transparent background, minimalist line art style, clean edges, no shading, no texture, no details, short sleeves',
  },
  '19': {
    filename: 'heavy-cotton-tee.png',
    prompt:
      'Simple black outline of a classic cotton t-shirt, front view, centered, transparent background, minimalist line drawing, crew neck, short sleeves, no shading, no details',
  },
  '380': {
    filename: 'garment-dyed-tshirt.png',
    prompt:
      'Clean outline silhouette of a relaxed fit t-shirt, front view, transparent background, simple black line art, crew neck, short sleeves, minimalist style, no shading',
  },
  '146': {
    filename: 'heavy-blend-hoodie.png',
    prompt:
      'Simple black outline of a pullover hoodie with hood, front view, centered, transparent background, minimalist line art, kangaroo pocket, drawstrings, no shading, no texture, clean edges',
  },
  '387': {
    filename: 'heavy-blend-crewneck.png',
    prompt:
      'Simple outline of a crewneck sweatshirt, front view, transparent background, black line art, ribbed collar and cuffs, long sleeves, minimalist style, no shading, no details',
  },
  '679': {
    filename: 'sports-jersey.png',
    prompt:
      'Clean outline of an athletic sports jersey, front view, transparent background, simple black line art, sleeveless, minimalist style, no shading, no numbers, no details',
  },
  '163': {
    filename: 'tote-bag.png',
    prompt:
      'Simple black outline of a canvas tote bag, front view, centered, transparent background, minimalist line art, two handles at top, rectangular shape, no shading, no texture',
  },
  '327': {
    filename: 'large-organic-tote.png',
    prompt:
      'Simple outline of a large tote bag, front view, transparent background, black line art, two handles, tall rectangular shape, minimalist style, no shading, no details',
  },
  '45': {
    filename: 'iphone-case.png',
    prompt:
      'Simple black outline of an iPhone case, front view, centered, transparent background, minimalist line art, rounded corners, camera cutout at top, clean edges, no shading',
  },
  '46': {
    filename: 'samsung-case.png',
    prompt:
      'Simple outline of a Samsung phone case, front view, transparent background, black line art, rounded corners, camera cutout, minimalist style, no shading, clean edges',
  },
  '20': {
    filename: 'white-glossy-mug.png',
    prompt:
      'Simple black outline of a coffee mug, side view showing handle, centered, transparent background, minimalist line art, cylindrical shape with handle, no shading, no details, clean edges',
  },
  '21': {
    filename: 'black-glossy-mug.png',
    prompt:
      'Simple outline of a ceramic mug, side view with handle visible, transparent background, black line art, cylindrical body, curved handle, minimalist style, no shading',
  },
  '1': {
    filename: 'poster.png',
    prompt:
      'Simple black outline of a rectangular poster, front view, centered, transparent background, minimalist line art, portrait orientation, clean edges, no frame, no shading',
  },
  '2': {
    filename: 'framed-poster.png',
    prompt:
      'Simple outline of a framed poster, front view, transparent background, black line art, rectangular frame with mat border, portrait orientation, minimalist style, no shading, clean edges',
  },
};

const dynamicOutlineCache = new Map();

function getPredefinedOutlineEntries() {
  return Object.entries(productOutlines).map(([productId, definition]) => ({
    productId,
    definition,
    source: 'predefined',
  }));
}

function getDynamicOutlineEntries() {
  return Array.from(dynamicOutlineCache.entries()).map(([productId, definition]) => ({
    productId,
    definition,
    source: 'dynamic',
  }));
}

function getAllOutlineEntries() {
  return [...getPredefinedOutlineEntries(), ...getDynamicOutlineEntries()];
}

function getPredefinedOutlineIds() {
  return Object.keys(productOutlines);
}

async function loadDynamicOutlines() {
  try {
    await fsPromises.access(DYNAMIC_OUTLINES_FILE, fs.constants.F_OK);
    const contents = await fsPromises.readFile(DYNAMIC_OUTLINES_FILE, 'utf8');
    const parsed = JSON.parse(contents);
    Object.entries(parsed).forEach(([id, definition]) => {
      dynamicOutlineCache.set(String(id), definition);
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to load dynamic product outlines:', error.message);
    }
  }
}

const dynamicOutlinesReady = loadDynamicOutlines();

async function saveDynamicOutlines() {
  const payload = Object.fromEntries(dynamicOutlineCache.entries());
  const data = JSON.stringify(payload, null, 2);
  await fsPromises.mkdir(path.dirname(DYNAMIC_OUTLINES_FILE), { recursive: true });
  await fsPromises.writeFile(DYNAMIC_OUTLINES_FILE, data, 'utf8');
}

let saveQueue = Promise.resolve();

function queueSave() {
  saveQueue = saveQueue
    .catch(() => {})
    .then(() => saveDynamicOutlines())
    .catch((error) => {
      console.warn('Failed to save dynamic product outlines:', error.message);
    });
  return saveQueue;
}

function cleanProductName(name) {
  if (!name || typeof name !== 'string') {
    return null;
  }
  return name.replace(/\s*\(.+?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferDescriptors(baseText = '') {
  const descriptors = new Set();
  const normalized = baseText.toLowerCase();

  if (/(hoodie|hooded)/.test(normalized)) {
    descriptors.add('hood visible');
    descriptors.add('kangaroo pocket');
  }

  if (/(sweatshirt|crewneck)/.test(normalized)) {
    descriptors.add('long sleeves');
    descriptors.add('ribbed cuffs');
  }

  if (/(long[-\s]?sleeve)/.test(normalized)) {
    descriptors.add('long sleeves');
  }

  if (/(tank|sleeveless)/.test(normalized)) {
    descriptors.add('sleeveless');
  }

  if (/(tee|t-shirt|shirt)/.test(normalized)) {
    descriptors.add('crew neck');
    descriptors.add('short sleeves');
  }

  if (/(jersey)/.test(normalized)) {
    descriptors.add('athletic cut');
    descriptors.add('sleeveless');
  }

  if (/(mug|cup|tumbler)/.test(normalized)) {
    descriptors.add('side view showing handle');
  }

  if (/(poster|print|canvas)/.test(normalized)) {
    descriptors.add('rectangular shape');
    descriptors.add('portrait orientation');
  }

  if (/(frame|framed)/.test(normalized)) {
    descriptors.add('thin frame border');
  }

  if (/(pillow|cushion)/.test(normalized)) {
    descriptors.add('soft edges');
    descriptors.add('square shape');
  }

  if (/(blanket|towel|throw)/.test(normalized)) {
    descriptors.add('rectangular cloth');
  }

  if (/(case|iphone|samsung|phone)/.test(normalized)) {
    descriptors.add('rounded corners');
    descriptors.add('camera cutout');
  }

  if (/(hat|cap|beanie|visor)/.test(normalized)) {
    descriptors.add('front view');
    descriptors.add('simple silhouette');
  }

  if (/(bag|tote|backpack|duffel)/.test(normalized)) {
    descriptors.add('handles visible');
  }

  return Array.from(descriptors);
}

function buildPrompt(name, productTypeText) {
  const cleanName = cleanProductName(name) || 'product';
  const descriptors = inferDescriptors(`${cleanName} ${productTypeText || ''}`);
  const descriptorText = descriptors.length > 0 ? `${descriptors.join(', ')}, ` : '';
  return `Simple black outline of a ${cleanName}, front view, centered, transparent background, minimalist line art style, ${descriptorText}clean edges, no shading, no texture, no text, no people.`;
}

function buildDynamicOutlineDefinition({ productId, name, productType }) {
  const filename = `product-${productId}-outline.png`;
  const prompt = buildPrompt(name, productType);
  return {
    filename,
    prompt,
  };
}

function getOutlineDefinition(productId) {
  const id = String(productId);
  if (productOutlines[id]) {
    return productOutlines[id];
  }
  return dynamicOutlineCache.get(id) || null;
}

function setDynamicOutlineDefinition(productId, definition) {
  const id = String(productId);
  dynamicOutlineCache.set(id, definition);
  return queueSave();
}

function getDynamicOutlineIds() {
  return Array.from(dynamicOutlineCache.keys());
}

module.exports = {
  productOutlines,
  getOutlineDefinition,
  setDynamicOutlineDefinition,
  buildDynamicOutlineDefinition,
  dynamicOutlinesReady,
  saveDynamicOutlines,
  getDynamicOutlineIds,
  getPredefinedOutlineEntries,
  getDynamicOutlineEntries,
  getAllOutlineEntries,
  getPredefinedOutlineIds,
};
