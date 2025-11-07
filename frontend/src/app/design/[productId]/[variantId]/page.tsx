/* eslint-disable @next/next/no-img-element */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Rect } from 'react-konva';
import useImage from 'use-image';
import { config } from '@/config/api';
import { authenticatedFetch, handleAuthError } from '@/utils/auth';
import { usePricing } from '@/state/pricing/pricingStore';

// Silence verbose logs in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    const noop = () => {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (console as any).log = noop;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (console as any).debug = noop;
  } catch {}
}

interface ImageShape {
  id: string;
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface TextShape {
  id: string;
  type: 'text';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  width?: number;
  height?: number;
  rotation?: number;
}

interface Artwork {
  _id?: string;
  id?: string;
  imageUrl: string;
}

interface ProductVariantFile {
  type?: string;
  preview_url?: string;
  thumbnail_url?: string;
  url?: string;
}

interface ProductVariantOption {
  id: string;
  value: string;
}

interface ProductVariant {
  id: number;
  name?: string;
  files?: ProductVariantFile[];
  options?: ProductVariantOption[];
}

interface ProductSummary {
  title?: string;
  image?: string;
}

interface ProductData {
  sync_product?: {
    name?: string;
    thumbnail_url?: string;
  };
  sync_variants?: ProductVariant[];
  variants?: ProductVariant[];
  product?: ProductSummary;
}

type PlacementKey = string;

type PlacementData = {
  images: ImageShape[];
  texts: TextShape[];
};

const CANVAS_SIZE = 800;

type PrintAreaInfo = {
  placement: string;
  areaWidth: number;
  areaHeight: number;
  displayName?: string;
};

type CanvasPrintAreaRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rawWidth: number;
  rawHeight: number;
  info: PrintAreaInfo;
};

interface PrintAreaDimensions {
  area_width?: number;
  area_height?: number;
  width?: number;
  height?: number;
  print_area_width?: number;
  print_area_height?: number;
}

interface PrintfilePlacement extends PrintAreaDimensions {
  placement?: string;
  print_area?: PrintAreaDimensions;
  printfile?: PrintAreaDimensions;
  display_name?: string;
}

const DraggableImage = ({ src }: { src: string }) => {
  return (
    <img
      src={src}
      alt="artwork"
      draggable
      onDragStart={(e: React.DragEvent<HTMLImageElement>) => {
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.setData('imageSrc', src);
      }}
      style={{ width: '100px', height: 'auto', cursor: 'pointer', margin: '5px' }}
    />
  );
};

interface CanvasImageProps {
  shapeProps: ImageShape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: ImageShape) => void;
  draggable?: boolean;
}

const CanvasImage = ({ shapeProps, isSelected, onSelect, onChange, draggable = true }: CanvasImageProps) => {
  const shapeRef = useRef<Konva.Image | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const [image] = useImage(shapeProps.src, 'anonymous');

  useEffect(() => {
    if (isSelected && shapeRef.current) {
      trRef.current?.nodes([shapeRef.current]);
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        image={image}
        draggable={draggable}
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) {
            return;
          }
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

interface CanvasTextProps {
  shapeProps: TextShape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: TextShape) => void;
  draggable?: boolean;
}

const CanvasText = ({ shapeProps, isSelected, onSelect, onChange, draggable = true }: CanvasTextProps) => {
  const shapeRef = useRef<Konva.Text | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);

  useEffect(() => {
    if (isSelected) {
      trRef.current?.nodes([shapeRef.current as Konva.Text]);
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaText
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable={draggable}
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) {
            return;
          }
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Function to export only artwork content without background
const exportArtworkOnly = async (images: ImageShape[], texts: TextShape[]): Promise<string> => {
  if (images.length === 0 && texts.length === 0) {
    // Return a minimal transparent square for Printful compatibility
    const tempStage = new Konva.Stage({
      container: document.createElement('div'),
      width: 100,
      height: 100,
    });

    const tempLayer = new Konva.Layer();
    tempStage.add(tempLayer);

    // Export transparent background (no white rectangle)
    const dataUrl = tempStage.toDataURL({ pixelRatio: 1 });
    tempStage.destroy();
    
    return dataUrl;
  }

  // Calculate bounding box of all artwork elements
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  [...images, ...texts].forEach(element => {
    const x = element.x;
    const y = element.y;
    const width = element.width || 100;
    const height = element.height || 100;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  // Ensure minimum dimensions for Printful compatibility
  const minWidth = 100;
  const minHeight = 100;
  const padding = 20;
  const artworkWidth = Math.max(minWidth, maxX - minX + (padding * 2));
  const artworkHeight = Math.max(minHeight, maxY - minY + (padding * 2));

  // Create a temporary stage for clean artwork export
  const tempStage = new Konva.Stage({
    container: document.createElement('div'),
    width: artworkWidth,
    height: artworkHeight,
  });

  const tempLayer = new Konva.Layer();
  tempStage.add(tempLayer);

  // NO white background - keep transparency

  // Add images to temp layer
  for (const imageShape of images) {
    try {
      const tempImage = new Konva.Image({
        x: imageShape.x - minX + padding,
        y: imageShape.y - minY + padding,
        width: imageShape.width || 100,
        height: imageShape.height || 100,
        rotation: imageShape.rotation || 0,
        image: await loadImage(imageShape.src),
      });
      tempLayer.add(tempImage);
    } catch (error) {
      console.warn('Failed to load image for export:', imageShape.src, error);
    }
  }

  // Add texts to temp layer
  for (const textShape of texts) {
    const tempText = new Konva.Text({
      x: textShape.x - minX + padding,
      y: textShape.y - minY + padding,
      text: textShape.text,
      fontSize: textShape.fontSize,
      fontFamily: textShape.fontFamily,
      fill: textShape.fill,
      width: textShape.width,
      height: textShape.height,
      rotation: textShape.rotation || 0,
    });
    tempLayer.add(tempText);
  }

  // Export the clean artwork with transparent background
  const dataUrl = tempStage.toDataURL({ pixelRatio: 2 });
  
  // Clean up
  tempStage.destroy();
  
  return dataUrl;
};

// Helper function to load image for temp stage
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const DesignPage = () => {
  const params = useParams<{ productId: string; variantId: string }>();
  const router = useRouter();
  const { productId, variantId } = params;
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  // Cache mockups per placement to avoid regenerating
  const [mockupCache, setMockupCache] = useState<Record<string, string>>({});
  const [printArea, setPrintArea] = useState<PrintAreaInfo | null>(null);
  const [allPrintAreas, setAllPrintAreas] = useState<Record<string, PrintAreaInfo>>({});
  
  // Multi-placement support
  const [availablePlacements, setAvailablePlacements] = useState<string[]>(['front']);
  const [placementLabels, setPlacementLabels] = useState<Record<string, string>>({});
  const [currentPlacement, setCurrentPlacement] = useState<string>('front');
  const [placementData, setPlacementData] = useState<Record<PlacementKey, PlacementData>>({
    front: { images: [], texts: [] }
  });
  
  const [selectedId, selectShape] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [isMockupLoading, setIsMockupLoading] = useState(false);
  const [mockupError, setMockupError] = useState<string | null>(null);
  const [isInitialMockupLoading, setIsInitialMockupLoading] = useState(false);
  const [showMockupModal, setShowMockupModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [generatedMockupUrl, setGeneratedMockupUrl] = useState<string | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const { setInputs, setContinueHandler, breakdown } = usePricing();
  
  const [continueRequested, setContinueRequested] = useState(false);
  

  // Helper to get current placement's images and texts
  const getCurrentImages = () => placementData[currentPlacement]?.images || [];
  const getCurrentTexts = () => placementData[currentPlacement]?.texts || [];
  
  // Helper to get product outline (shared across all placements)
  const getProductOutline = () => mockupCache['outline'] || null;
  
  const getCanvasPrintAreaRect = useCallback(
    (placement: string): CanvasPrintAreaRect => {
      const fallbackInfo: PrintAreaInfo = {
        placement,
        areaWidth: 3600,
        areaHeight: 4800,
        displayName: 'Print Area'
      };

      const activeInfo =
        allPrintAreas[placement] ??
        (placement === currentPlacement && printArea ? printArea : undefined);

      const areaInfo = activeInfo ?? fallbackInfo;

      const rawWidth = areaInfo.areaWidth || 3600;
      const rawHeight = areaInfo.areaHeight || 4800;
      const REFERENCE_MAX_DIMENSION = 4800; // 16" at 300DPI
      const MAX_CANVAS_DISPLAY = CANVAS_SIZE * 0.6;
      const scaleRatio = MAX_CANVAS_DISPLAY / REFERENCE_MAX_DIMENSION;

      let width = rawWidth * scaleRatio;
      let height = rawHeight * scaleRatio;
      const maxFit = 0.7;
      if (width > CANVAS_SIZE * maxFit || height > CANVAS_SIZE * maxFit) {
        const excessScale = Math.max(
          width / (CANVAS_SIZE * maxFit),
          height / (CANVAS_SIZE * maxFit)
        );
        width /= excessScale;
        height /= excessScale;
      }

      let verticalOffset = -0.05;
      if (
        placement.includes('sleeve') ||
        placement === 'left' ||
        placement === 'right' ||
        width < CANVAS_SIZE * 0.25
      ) {
        verticalOffset = 0;
      }

      const x = (CANVAS_SIZE - width) / 2;
      const y = (CANVAS_SIZE - height) / 2 + CANVAS_SIZE * verticalOffset;

      return {
        x,
        y,
        width,
        height,
        rawWidth,
        rawHeight,
        info: areaInfo
      };
    },
    [allPrintAreas, currentPlacement, printArea]
  );

  // Helper to update current placement data
  const updateCurrentImages = (images: ImageShape[]) => {
    setPlacementData(prev => ({
      ...prev,
      [currentPlacement]: {
        ...(prev[currentPlacement] ?? { images: [], texts: [] }),
        images
      }
    }));
  };
  
  const updateCurrentTexts = (texts: TextShape[]) => {
    setPlacementData(prev => ({
      ...prev,
      [currentPlacement]: {
        ...(prev[currentPlacement] ?? { images: [], texts: [] }),
        texts
      }
    }));
  };

  // Update pricing when variant or placements change
  useEffect(() => {
    interface VariantWithPrice {
      retail_price?: string | number;
      currency?: string;
      [key: string]: unknown;
    }
    const variantWithPrice = variant as unknown as VariantWithPrice;
    const basePrice = variantWithPrice?.retail_price ? parseFloat(String(variantWithPrice.retail_price)) || 0 : 0;
    const currency = variantWithPrice?.currency || 'USD';

    const placementKeys = Object.keys(placementData || {});
    interface PlacementDataEntry {
      images?: unknown[];
      texts?: unknown[];
      [key: string]: unknown;
    }
    const placementsWithContent = placementKeys.filter(k => {
      const pd = (placementData as Record<string, PlacementDataEntry>)[k];
      return (pd?.images?.length || 0) > 0 || (pd?.texts?.length || 0) > 0;
    });
    const placementCount = Math.max(placementsWithContent.length, basePrice > 0 ? 1 : 0);
    const extraPlacements = Math.max(0, placementCount - 1);

    setInputs(prev => ({
      ...prev,
      currency,
      basePrice,
      quantity: 1,
      extraPlacements,
      hasInsideLabel: false,
      hasOutsideLabel: false,
      isPremiumImage: false,
      isEmbroidery: false,
      embroideryDigitizationFeeApplicable: false
    }));
  }, [variant, placementData, setInputs]);

  // (moved below handleGenerateMockup definition)
  
  // Helper to update mockup cache for a specific placement
  const updateMockupCache = useCallback((placement: string, mockupUrl: string) => {
    setMockupCache(prev => ({
      ...prev,
      [placement]: mockupUrl
    }));
  }, []);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const res = await fetch(config.endpoints.artwork);
        if (res.ok) {
          const data = (await res.json()) as Artwork[];
          setArtworks(data);
        } else {
          console.error("Failed to fetch artwork");
        }
      } catch (error) {
        console.error('Error fetching artwork:', error);
      }
    };

    const fetchProduct = async () => {
      try {
        console.log(`Fetching product with productId: ${productId}`);
        const res = await fetch(`${config.endpoints.products}/${productId}`);
        if (res.ok) {
          const data = (await res.json()) as ProductData;
          console.log('Product data received:', data);
          setProduct(data);

          // Find the specific variant (handle both API structures)
          const variants = data.sync_variants || data.variants || [];
          console.log(`Found ${variants.length} variants`);
          if (variants.length > 0) {
            const selectedVariant = variants.find((v) => v.id === parseInt(variantId as string, 10));
            if (selectedVariant) {
              console.log('Selected variant:', selectedVariant);
              console.log('Variant files:', selectedVariant.files);
              setVariant(selectedVariant);
              setMockupCache({}); // Clear mockup cache when variant changes
            } else {
              console.error(`Variant ${variantId} not found in product variants`);
            }
          }
        } else {
          console.error("Failed to fetch product", res.status);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    
    
    const fetchPlacements = async () => {
      try {
        const url = `${config.apiUrl}/api/catalog/products/${productId}/placements`;
        console.log('Fetching placements from:', url);
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as {
            placements: string[];
            placementLabels: Record<string, string>;
          };
          console.log('Placements data:', data);
          console.log('Available placements:', data.placements);
          console.log('Placement labels:', data.placementLabels);
          setAvailablePlacements(data.placements);
          setPlacementLabels(data.placementLabels);
          
          // Initialize placement data for all placements, preserving existing data
          setPlacementData(prev => {
            const newData: Record<string, PlacementData> = {};
            data.placements.forEach((placement) => {
              // Preserve existing data if it exists, otherwise initialize with empty arrays
              newData[placement] = prev[placement] || { images: [], texts: [] };
            });
            return newData;
          });
          setCurrentPlacement(data.placements[0] || 'front');
        } else {
          console.error('Failed to fetch placements:', res.status, await res.text());
        }
      } catch (error) {
        console.error('Error fetching placements:', error);
      }
    };
    
    fetchArtwork();
    fetchProduct();
    fetchPlacements();
  }, [productId, variantId]);
  
  const getVariantFallbackMockup = useCallback((productData: ProductData | null, variantData: ProductVariant | null): string | null => {
    if (!variantData) {
      return null;
    }

    if (variantData.files && Array.isArray(variantData.files)) {
      const flatFile = variantData.files.find((f) => f.type === 'default' || f.type === 'flat' || f.type === 'front');
      if (flatFile) {
        console.log('Using variant flat/default file as fallback mockup:', flatFile);
        return flatFile.preview_url || flatFile.thumbnail_url || flatFile.url || null;
      }
    }

    if (productData?.sync_product?.thumbnail_url) {
      console.log('Using product thumbnail as fallback mockup:', productData.sync_product.thumbnail_url);
      return productData.sync_product.thumbnail_url;
    }

    if (productData?.product?.image) {
      console.log('Using product image as fallback mockup:', productData.product.image);
      return productData.product.image;
    }

    if (variantData?.files && Array.isArray(variantData.files)) {
      const previewFile = variantData.files.find((f) => f.type === 'preview');
      if (previewFile) {
        console.warn('Using preview asset as fallback mockup (may include lifestyle imagery):', previewFile);
        return previewFile.preview_url || previewFile.thumbnail_url || previewFile.url || null;
      }
    }

    console.warn('No fallback mockup assets available.');
    return null;
  }, []);

  const fetchPrintAreaInfo = useCallback(async (variantIdNumber: number, placement: string) => {
    try {
      const res = await fetch(`${config.apiUrl}/api/catalog/products/${productId}/printfiles?variantId=${variantIdNumber}`);
      if (!res.ok) {
        console.error('Failed to fetch print files', res.status, await res.text());
        return;
      }

      const data = (await res.json()) as {
        printfiles?: PrintfilePlacement[];
        variant_printfiles?: PrintfilePlacement[];
      };
      const placements = data?.printfiles || data?.variant_printfiles || [];
      console.log('Raw placements data:', placements);
      
      // Store all print areas (no index-based guessing to avoid front/back swaps)
      const printAreasMap: Record<string, PrintAreaInfo> = {};
      placements.forEach((p, index) => {
        const areaSource: PrintAreaDimensions | undefined = p?.print_area || p?.printfile || p;
        const areaWidth = areaSource?.area_width || areaSource?.width || areaSource?.print_area_width;
        const areaHeight = areaSource?.area_height || areaSource?.height || areaSource?.print_area_height;

        const rawPlacement = (p?.placement || '').toLowerCase();
        const nameHint = (p?.display_name || '').toLowerCase();
        let placementKey: string | null = null;
        if (rawPlacement) {
          placementKey = rawPlacement;
        } else if (nameHint.includes('back')) {
          placementKey = 'back';
        } else if (nameHint.includes('front')) {
          placementKey = 'front';
        } else if (nameHint.includes('left') && nameHint.includes('sleeve')) {
          placementKey = 'sleeve_left';
        } else if (nameHint.includes('right') && nameHint.includes('sleeve')) {
          placementKey = 'sleeve_right';
        }

        console.log(`Placement ${index}:`, {
          placement: p?.placement,
          inferredKey: placementKey,
          areaWidth,
          areaHeight,
          displayName: p?.display_name
        });

        if (areaWidth && areaHeight && placementKey) {
          printAreasMap[placementKey] = {
            placement: placementKey,
            areaWidth,
            areaHeight,
            displayName: p?.display_name,
          };
        }
      });
      
      setAllPrintAreas(printAreasMap);
      console.log('All print areas loaded:', printAreasMap);
      
      // Set current placement's print area - use first available if placement not found
      let printAreaToSet = printAreasMap[placement];
      
      if (!printAreaToSet) {
        // Try 'front' as fallback
        printAreaToSet = printAreasMap['front'];
      }
      
      if (!printAreaToSet) {
        // Use the first available placement as last resort
        const firstKey = Object.keys(printAreasMap)[0];
        if (firstKey) {
          printAreaToSet = printAreasMap[firstKey];
        }
      }
      
      if (printAreaToSet) {
        setPrintArea(printAreaToSet);
        console.log('✅ Print area set successfully:', printAreaToSet);
      } else {
        console.warn('⚠️ No print area data available - using default');
        // Set a default print area so the rectangle still shows
        const defaultPrintArea: PrintAreaInfo = {
          placement: placement,
          areaWidth: 3600,  // 12 inches at 300 DPI
          areaHeight: 4800, // 16 inches at 300 DPI
          displayName: 'Default Print Area'
        };
        setPrintArea(defaultPrintArea);
        console.log('Using default print area:', defaultPrintArea);
      }
    } catch (error) {
      console.error('Error fetching print area info:', error);
    }
  }, [productId]);

  const loadProductOutline = useCallback(async (): Promise<boolean> => {
    try {
      console.log(`Loading product outline for product ${productId}`);
      
      // Try to get the outline from the outlines API
      const response = await fetch(
        `${config.apiUrl}/api/outlines/${productId}`
      );

      if (response.ok) {
        // Outline exists, use the URL directly
        const outlineUrl = `${config.apiUrl}/api/outlines/${productId}`;
        updateMockupCache('outline', outlineUrl);
        console.log(`✓ Loaded product outline:`, outlineUrl);
        return true;
      }
      
      // Outline doesn't exist, try to generate it
      console.log('Product outline not found, attempting to generate...');
      const generateResponse = await fetch(
        `${config.apiUrl}/api/outlines/generate/${productId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );
      
      if (generateResponse.ok) {
        const data = await generateResponse.json();
        if (data.url) {
          updateMockupCache('outline', data.url);
          console.log(`✓ Generated and loaded product outline:`, data.url);
          return true;
        }
      }
      
      console.log('Product outline generation failed');
      return false;
    } catch (error) {
      console.log('Product outline loading failed:', error);
      return false;
    }
  }, [productId, updateMockupCache]);

  useEffect(() => {
    if (!variant || !product) {
      return;
    }

    const placement = currentPlacement || 'front';
    const variantIdNumber = typeof variant.id === 'number' ? variant.id : parseInt(variantId as string, 10);
    if (!variantIdNumber) {
      console.warn('Variant id not available.');
      return;
    }

    const initializeDesignCanvas = async () => {
      console.log(`Initializing design canvas for variant ${variantIdNumber}, placement ${placement}`);
      
      // Fetch print area info first (needed for print area rectangles)
      await fetchPrintAreaInfo(variantIdNumber, placement);
      
      // Check if we already have the product outline loaded (shared across all placements)
      if (mockupCache['outline']) {
        console.log(`Using cached product outline`);
        setIsInitialMockupLoading(false);
        return;
      }
      
      // Load product outline (only needs to be done once per product)
      const outlineLoaded = await loadProductOutline();
      
      if (!outlineLoaded) {
        console.error(`Failed to load product outline for product ${productId}`);
        // Try to use fallback variant image
        const fallback = getVariantFallbackMockup(product, variant);
        if (fallback) {
          updateMockupCache('outline', fallback);
        }
      }
      
      setIsInitialMockupLoading(false);
    };

    initializeDesignCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, product, currentPlacement, variantId, fetchPrintAreaInfo, loadProductOutline, getVariantFallbackMockup, updateMockupCache]);

  // Update the print area when placement changes
  useEffect(() => {
    if (allPrintAreas[currentPlacement]) {
      setPrintArea(allPrintAreas[currentPlacement]);
      console.log('Switched to placement:', currentPlacement, allPrintAreas[currentPlacement]);
    }
  }, [currentPlacement, allPrintAreas]);

  // Check if ANY placement has design elements
  const hasDesignElements = useMemo(() => {
    return availablePlacements.some(placement => {
      const data = placementData[placement];
      return data && (data.images.length > 0 || data.texts.length > 0);
    });
  }, [availablePlacements, placementData]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    stage.setPointersPositions(e.nativeEvent);
    const imageSrc = e.dataTransfer.getData('imageSrc');
    console.log(`[Drag Drop] Image dropped: ${imageSrc} on placement: ${currentPlacement}`);
    if (!imageSrc) return;

    const placement = currentPlacement;
    const pointerPosition = stage.getPointerPosition() ?? {
      x: CANVAS_SIZE / 2,
      y: CANVAS_SIZE / 2
    };
    const rect = getCanvasPrintAreaRect(placement);
    const areaInfo = rect.info;
    const areaWidthPx = areaInfo.areaWidth || 3600;
    const areaHeightPx = areaInfo.areaHeight || 4800;

    const appendImageToPlacement = (naturalWidth?: number, naturalHeight?: number) => {
      let width = rect.width * 0.5;
      let height = rect.height * 0.5;

      if (naturalWidth && naturalHeight) {
        const widthFromArea = (naturalWidth / areaWidthPx) * rect.width;
        const heightFromArea = (naturalHeight / areaHeightPx) * rect.height;

        if (widthFromArea > 0 && heightFromArea > 0) {
          width = widthFromArea;
          height = heightFromArea;
        }

        const maxWidth = rect.width * 0.95;
        const maxHeight = rect.height * 0.95;
        const scaleDown = Math.min(maxWidth / width, maxHeight / height, 1);
        width *= scaleDown;
        height *= scaleDown;

        const minSize = Math.min(rect.width, rect.height) * 0.2;
        const scaleUp = Math.max(minSize / width, minSize / height, 1);
        width *= scaleUp;
        height *= scaleUp;
      }

      const dropX = pointerPosition.x ?? rect.x + rect.width / 2;
      const dropY = pointerPosition.y ?? rect.y + rect.height / 2;
      const tentativeX = dropX - width / 2;
      const tentativeY = dropY - height / 2;

      const minX = rect.x;
      const maxX = rect.x + rect.width - width;
      const minY = rect.y;
      const maxY = rect.y + rect.height - height;

      const clampedX = Math.min(Math.max(tentativeX, minX), maxX);
      const clampedY = Math.min(Math.max(tentativeY, minY), maxY);

      setPlacementData(prev => {
        const existing = prev[placement] ?? { images: [], texts: [] };
        const newImage: ImageShape = {
          id: `image${existing.images.length + 1}_${placement}`,
          type: 'image',
          src: imageSrc,
          x: clampedX,
          y: clampedY,
          width,
          height
        };
        console.log(`[Drag Drop] Adding scaled image:`, newImage);
        return {
          ...prev,
          [placement]: {
            ...existing,
            images: [...existing.images, newImage]
          }
        };
      });
    };

    const preload = new window.Image();
    preload.crossOrigin = 'anonymous';
    preload.onload = () => appendImageToPlacement(preload.naturalWidth, preload.naturalHeight);
    preload.onerror = () => appendImageToPlacement();
    preload.src = imageSrc;
  };

  const addText = () => {
    const currentTexts = getCurrentTexts();
    const newText: TextShape = {
      x: 50,
      y: 50,
      text: 'Your Text Here',
      fontSize: 20,
      fontFamily: 'Arial',
      fill: '#000000',
      id: `text${currentTexts.length + 1}_${currentPlacement}`,
      type: 'text',
    };
    updateCurrentTexts([...currentTexts, newText]);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const currentTexts = getCurrentTexts();
    const selectedTextIndex = currentTexts.findIndex((t) => t.id === selectedId);
    if (selectedTextIndex !== -1) {
      const newTexts = currentTexts.slice();
      newTexts[selectedTextIndex] = {
        ...newTexts[selectedTextIndex],
        [name]: name === 'fontSize' ? Number(value) : value
      };
      updateCurrentTexts(newTexts);
    }
  };

  const handleSaveDesign = async () => {
    const designData = {
      productVariantId: parseInt(variantId as string, 10),
      productId: parseInt(productId as string, 10),
      placements: placementData
    };

    try {
      const res = await authenticatedFetch(config.endpoints.designs, {
        method: 'POST',
        body: JSON.stringify(designData)
      }, router);

      if (res.ok) {
        const savedDesign = await res.json();
        console.log('Design saved:', savedDesign);
        alert('Design saved successfully!');
      } else {
        const errorData = await res.json();
        console.error('Failed to save design:', errorData.msg);
        
        // Check if it's an auth error that wasn't handled by authenticatedFetch
        if (handleAuthError(res, errorData, router)) {
          return;
        }
        
        alert(`Error: ${errorData.msg}`);
      }
    } catch (error) {
      console.error('Error saving design:', error);
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        // Already handled by authenticatedFetch
        return;
      }
      alert('An error occurred while saving the design.');
    }
  };

  const handleAddToCart = () => {
    try {
      interface CartItem {
        id: string;
        [key: string]: unknown;
      }
      const existingRaw = typeof window !== 'undefined' ? localStorage.getItem('cart') : null;
      const existing = existingRaw ? (JSON.parse(existingRaw) as CartItem[]) : [];

      // Pick an image: prefer a generated mockup; otherwise outline or variant fallback
      const firstMockupEntry = Object.entries(mockupCache).find(([k, v]) => k !== 'outline' && v);
      const imageUrl = firstMockupEntry?.[1] || getProductOutline() || (variant?.files?.[0]?.preview_url || variant?.files?.[0]?.thumbnail_url || variant?.files?.[0]?.url) || '';

      const priceNumber = Number.isFinite(breakdown?.total) ? breakdown.total : 0;

      const item = {
        id: `custom-${productId}-${variantId}-${Date.now()}`,
        type: 'custom_design' as const,
        productId: String(productId),
        variantId: typeof variant?.id === 'number' ? variant.id : parseInt(variantId as string, 10),
        productVariantId: typeof variant?.id === 'number' ? variant.id : parseInt(variantId as string, 10),
        name: product?.sync_product?.name || product?.product?.title || variant?.name || 'Custom product',
        variant,
        quantity: 1,
        price: String(priceNumber.toFixed(2)),
        image: imageUrl as string,
        design: {
          ...(placementData[currentPlacement] || { images: [], texts: [] }),
          // Ensure we include at least one print file for Printful
          files: (imageUrl ? [{ url: imageUrl }] : [])
        }
      };

      const updated = Array.isArray(existing) ? [...existing, item] : [item];
      localStorage.setItem('cart', JSON.stringify(updated));
      // Notify listeners (e.g., navbar)
      window.dispatchEvent(new Event('storage'));
      router.push('/cart');
    } catch (e) {
      console.error('Failed to add to cart', e);
      alert('Sorry, we could not add this to your cart.');
    }
  };

  const checkDeselect = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const selectedText = getCurrentTexts().find((t) => t.id === selectedId);

  const handleGenerateMockup = useCallback(async () => {
    if (!variant) {
      setMockupError('Variant details are not available yet.');
      return;
    }

    if (!stageRef.current) {
      setMockupError('Design canvas is not ready.');
      return;
    }

    const variantIdNumber = typeof variant.id === 'number' ? variant.id : parseInt(variantId as string, 10);
    if (!variantIdNumber) {
      setMockupError('Could not determine variant id.');
      return;
    }

    try {
      setIsMockupLoading(true);
      setMockupError(null);

      // Check if ANY placement has designs
      const hasAnyDesigns = availablePlacements.some(placement => {
        const data = placementData[placement];
        return data && (data.images.length > 0 || data.texts.length > 0);
      });

      if (!hasAnyDesigns) {
        setMockupError('No designs found. Add artwork or text to generate mockups.');
        return;
      }

      console.log(`[Multi-Placement] Preparing placements (designs only) from:`, availablePlacements);

      // Build placements array ONLY for placements that actually have designs
      type PlacementRequest = {
        placement: string;
        designDataUrl: string;
        artworkDimensions: { width: number; height: number };
        position: {
          left: number;
          top: number;
          width: number;
          height: number;
        };
      };

      const placements = (await Promise.all(
        availablePlacements.map(async (placement) => {
          const data = placementData[placement];
          const images = data.images || [];
          const texts = data.texts || [];
          const hasDesigns = images.length > 0 || texts.length > 0;

          let designDataUrl: string;
          let artworkWidth: number;
          let artworkHeight: number;
          let position: { left: number; top: number; width: number; height: number } | null = null;

          if (hasDesigns) {
            // Calculate artwork dimensions for this placement
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            [...images, ...texts].forEach(element => {
              const x = element.x;
              const y = element.y;
              const width = element.width || 100;
              const height = element.height || 100;
              
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x + width);
              maxY = Math.max(maxY, y + height);
            });

            artworkWidth = Math.max(100, maxX - minX);
            artworkHeight = Math.max(100, maxY - minY);

            // Export artwork for this placement
            designDataUrl = await exportArtworkOnly(images, texts);

            // Map canvas coords to print-area pixel coordinates
            const rect = getCanvasPrintAreaRect(placement);
            const area = rect.info;
            const areaWidthPx = area.areaWidth || 3600;
            const areaHeightPx = area.areaHeight || 4800;

            // Ratios within the on-canvas print area rectangle
            const relLeft = (minX - rect.x) / rect.width;
            const relTop = (minY - rect.y) / rect.height;
            const relWidth = artworkWidth / rect.width;
            const relHeight = artworkHeight / rect.height;

            // Convert to printful pixels
            let targetWidthPx = Math.round(relWidth * areaWidthPx);
            let targetHeightPx = Math.round(relHeight * areaHeightPx);

            // Auto-scale to fit within max area while preserving aspect
            const widthScale = areaWidthPx / Math.max(1, targetWidthPx);
            const heightScale = areaHeightPx / Math.max(1, targetHeightPx);
            const fitScale = Math.min(1, Math.min(widthScale, heightScale));
            targetWidthPx = Math.round(targetWidthPx * fitScale);
            targetHeightPx = Math.round(targetHeightPx * fitScale);

            let leftPx = Math.round(relLeft * areaWidthPx);
            let topPx = Math.round(relTop * areaHeightPx);

            // Clamp to stay inside print area
            leftPx = Math.max(0, Math.min(areaWidthPx - targetWidthPx, leftPx));
            topPx = Math.max(0, Math.min(areaHeightPx - targetHeightPx, topPx));

            position = { left: leftPx, top: topPx, width: targetWidthPx, height: targetHeightPx };
            
            return {
              placement,
              designDataUrl,
              artworkDimensions: {
                width: artworkWidth,
                height: artworkHeight
              },
              position: position ?? {
                left: 0,
                top: 0,
                width: areaWidthPx,
                height: areaHeightPx
              }
            };
          }

          return null; // Skip placements without any designs
        })
      )).filter(Boolean) as PlacementRequest[];

      console.log(`[Multi-Placement] Prepared ${placements.length} placement(s) with designs`);

      // Send all placements in a single request
      const requestedPlacementSet = new Set(placements.map(p => p.placement));
      console.log('[Multi-Placement] Requested placements:', Array.from(requestedPlacementSet));
      const requestBody = {
        variantId: variantIdNumber,
        placements
      };

      console.log('[Multi-Placement Mockup Request] Sending placements to backend');

      const response = await fetch(`${config.apiUrl}/api/catalog/products/${productId}/mockup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(`Mockup generation returned ${response.status}`);
        if (response.status === 429) {
          const message = data?.message || 'Rate limit exceeded. Please wait a few minutes before trying again.';
          setMockupError(message);
        } else {
          setMockupError('Unable to generate mockups at this time. Please try again later.');
        }
        return;
      }

      // Handle multiple mockups in response
      interface MockupResponse {
        placement: string;
        mockup_url?: string;
        url?: string;
        [key: string]: unknown;
      }
      const returnedMockups = (data?.mockups || []) as MockupResponse[];
      console.log(`[Multi-Placement] Received ${returnedMockups.length} mockups from backend`);
      console.log('[Multi-Placement] Returned placements:', returnedMockups.map((m: MockupResponse) => m.placement));

      // Filter strictly to the placements we requested to avoid mirrored sides
      const filtered = returnedMockups.filter((m: MockupResponse) => requestedPlacementSet.has(m.placement));
      console.log(`[Multi-Placement] Using ${filtered.length} mockups after filtering to requested placements`);

      if (filtered.length > 0) {
        // Update cache with all generated mockups
        filtered.forEach((mockup: MockupResponse) => {
          const mockupUrl = mockup.mockup_url || mockup.url;
          const placement = mockup.placement;
          if (mockupUrl && placement) {
            updateMockupCache(placement, mockupUrl);
          }
        });

        // Show gallery modal with all mockups only when we have requested placements
        setShowGalleryModal(true);
        console.log(`✓ Generated ${filtered.length} mockup(s) for ${filtered.map((m: MockupResponse) => m.placement).join(', ')}`);
      } else {
        console.warn('[Multi-Placement] No valid mockups matched requested placements; not opening gallery');
      }
    } catch (error) {
      console.log('Multi-placement mockup generation failed:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred while generating the mockups.';
      setMockupError(message);
    } finally {
      setIsMockupLoading(false);
    }
  }, [variant, variantId, stageRef, productId, availablePlacements, placementData, updateMockupCache, getCanvasPrintAreaRect]);

  // Provide sticky continue handler: only flips a local flag; deep links no-op (run once on mount)
  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const cameFromBuilder = new URLSearchParams(search).get('from') === 'builder';
    if (!cameFromBuilder) {
      setContinueHandler(() => {});
      return () => setContinueHandler(undefined);
    }
    const onContinueClick = () => {
      setContinueRequested(true);
    };
    setContinueHandler(onContinueClick);
    return () => setContinueHandler(undefined);
  }, [setContinueHandler]);

  // When user clicks Continue and came from builder, generate mockups then open gallery
  useEffect(() => {
    if (!continueRequested) return;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const cameFromBuilder = new URLSearchParams(search).get('from') === 'builder';
    if (!cameFromBuilder) return;
    let cancelled = false;
    (async () => {
      await handleGenerateMockup();
      if (!cancelled) setShowGalleryModal(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [continueRequested, handleGenerateMockup]);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between shadow-lg border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/product/${productId}`)}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">
            {product?.sync_product?.name || product?.product?.title || 'Design Studio'}
          </h1>
          {variant && (
            <span className="text-sm text-gray-400">
              {variant.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {sidebarOpen ? '← Hide Tools' : 'Show Tools →'}
          </button>
          <button
            onClick={addText}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
          >
            ✏️ Add Text
          </button>
          <button
            onClick={handleSaveDesign}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
          >
            💾 Save Design
          </button>
          <button
            onClick={handleAddToCart}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
          >
            🛒 Add to Cart
          </button>
        </div>
      </div>

      {/* PostMockupActions modal removed; actions moved into Gallery Modal */}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-white text-gray-800 overflow-y-auto shadow-xl border-r border-gray-200">
            <div className="p-4">
              {/* Placement Selector */}
              {availablePlacements.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-3 text-purple-600">📍 Design Area</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {availablePlacements.map((placement) => {
                      const area = allPrintAreas[placement];
                      const widthInches = area ? (area.areaWidth / 300).toFixed(1) : '?';
                      const heightInches = area ? (area.areaHeight / 300).toFixed(1) : '?';
                      const placementDataForArea = placementData[placement];
                      const itemCount = (placementDataForArea?.images?.length || 0) + (placementDataForArea?.texts?.length || 0);
                      
                      return (
                        <button
                          key={placement}
                          onClick={() => setCurrentPlacement(placement)}
                          className={`px-3 py-2 rounded-lg font-semibold transition-all relative ${
                            currentPlacement === placement
                              ? 'bg-purple-600 text-white shadow-lg scale-105'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-102'
                          }`}
                          title={area ? `Print area: ${widthInches}" × ${heightInches}"` : 'Loading...'}
                        >
                          <div className="flex items-center justify-between">
                            <span>{placementLabels[placement] || placement}</span>
                            {itemCount > 0 && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                currentPlacement === placement 
                                  ? 'bg-white text-purple-600' 
                                  : 'bg-purple-600 text-white'
                              }`}>
                                {itemCount}
                              </span>
                            )}
                          </div>
                          {area && (
                            <div className={`text-xs mt-1 ${
                              currentPlacement === placement ? 'opacity-90' : 'opacity-70'
                            }`}>
                              {widthInches}&quot; × {heightInches}&quot;
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border-2 border-purple-600">
                    <div className="text-sm text-purple-900 font-bold">
                      ✏️ Currently Editing: {placementLabels[currentPlacement] || currentPlacement}
                    </div>
                    {printArea && (
                      <div className="text-xs text-purple-700 mt-1">
                        Max size: {(printArea.areaWidth / 300).toFixed(1)}&quot; × {(printArea.areaHeight / 300).toFixed(1)}&quot;
                      </div>
                    )}
                  </div>
                </div>
              )}

              <hr className="border-gray-300 my-4" />

              <h2 className="text-lg font-bold mb-4 text-purple-600">🎨 Artwork</h2>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {artworks.map((art) => (
                  <DraggableImage key={art._id || art.id} src={art.imageUrl} />
                ))}
              </div>

              <hr className="border-gray-300 my-4" />

              <h2 className="text-lg font-bold mb-4 text-purple-600">✏️ Actions</h2>
              <button
                onClick={addText}
                className="w-full mb-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
              >
                + Add Text
              </button>

              {selectedText && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="font-bold mb-3 text-purple-600">Edit Text</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm mb-1">Text:</label>
                      <input
                        type="text"
                        name="text"
                        value={selectedText.text}
                        onChange={handleTextChange}
                        className="w-full px-3 py-2 bg-white rounded border border-gray-300 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Font Size:</label>
                      <input
                        type="number"
                        name="fontSize"
                        value={selectedText.fontSize}
                        onChange={handleTextChange}
                        className="w-full px-3 py-2 bg-white rounded border border-gray-300 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Font Family:</label>
                      <input
                        type="text"
                        name="fontFamily"
                        value={selectedText.fontFamily}
                        onChange={handleTextChange}
                        className="w-full px-3 py-2 bg-white rounded border border-gray-300 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Color:</label>
                      <input
                        type="color"
                        name="fill"
                        value={selectedText.fill}
                        onChange={handleTextChange}
                        className="w-full h-10 bg-white rounded border border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Canvas & Live Mockup Area */}
        <div className="flex-1 flex bg-gray-100">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex-1 flex flex-col items-center justify-center gap-6 p-8"
          >
            <div
              className="relative bg-white rounded-xl shadow-2xl overflow-hidden flex items-center justify-center"
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            >
              {/* Prominent Placement Indicator */}
              {availablePlacements.length > 0 && (
                <div className="absolute top-4 left-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-20 border-2 border-purple-700">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">
                      {currentPlacement === 'front' ? '👕' : 
                       currentPlacement === 'back' ? '🔄' :
                       currentPlacement.includes('sleeve') ? '💪' : '📍'}
                    </span>
                    <div>
                      <div className="text-xl font-bold">{placementLabels[currentPlacement] || currentPlacement}</div>
                      <div className="text-xs opacity-90 uppercase tracking-wide">Currently Editing</div>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-purple-700"></div>
                </div>
              )}

              {isInitialMockupLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg bg-gray-50">
                  <div className="text-center px-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
                    <p className="font-bold text-xl text-gray-800 mb-2">Loading Product Outline...</p>
                    <p className="text-sm text-gray-600 mb-4">Generating clean product silhouette</p>
                    <p className="text-xs text-blue-600 font-semibold">✨ This should only take a moment!</p>
                  </div>
                </div>
              ) : getProductOutline() ? (
                <img
                  src={getProductOutline() as string}
                  alt="Product outline"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-contain pointer-events-none opacity-30"
                  onError={(e) => {
                    console.error('Failed to load product outline:', getProductOutline());
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
                  <div className="text-center px-8">
                    <div className="w-64 h-64 bg-gray-50 rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-gray-200">
                      <div className="text-center p-6">
                        <div className="text-6xl mb-4">👕</div>
                        <p className="font-bold text-xl text-gray-600 mb-2">Ready to Design!</p>
                        <p className="text-sm text-gray-600">Drag artwork from the sidebar to get started</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Product outline will appear when loaded</p>
                  </div>
                </div>
              )}

              <Stage
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onMouseDown={checkDeselect}
                onTouchStart={checkDeselect}
                ref={stageRef}
                className="relative z-10"
              >
                <Layer>
                  {(() => {
                    const rect = getCanvasPrintAreaRect(currentPlacement);
                    const activePrintArea = rect.info;
                    
                    console.log('Rendering print area:', activePrintArea);

                    const { width, height, x, y, rawWidth, rawHeight } = rect;

                    // Convert pixels to inches for display (assuming 300 DPI)
                    const widthInches = (rawWidth / 300).toFixed(1);
                    const heightInches = (rawHeight / 300).toFixed(1);
                    const displayName = activePrintArea.displayName || placementLabels[currentPlacement] || currentPlacement;

                    return (
                      <>
                        {/* Main print area rectangle */}
                        <Rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill="rgba(59, 130, 246, 0.08)"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dash={[10, 5]}
                          listening={false}
                        />
                        
                        {/* Corner markers for better visibility */}
                        {[
                          [x, y], // top-left
                          [x + width, y], // top-right
                          [x, y + height], // bottom-left
                          [x + width, y + height] // bottom-right
                        ].map(([cx, cy], idx) => (
                          <Rect
                            key={`corner-${idx}`}
                            x={cx - 8}
                            y={cy - 8}
                            width={16}
                            height={16}
                            fill="#2563eb"
                            listening={false}
                          />
                        ))}

                        {/* Label background */}
                        <Rect
                          x={x}
                          y={y - 44}
                          width={Math.max(220, displayName.length * 8 + 40)}
                          height={36}
                          fill="#1d4ed8"
                          cornerRadius={6}
                          listening={false}
                        />
                        
                        {/* Label text */}
                        <KonvaText
                          x={x + 12}
                          y={y - 38}
                          text={`📐 ${displayName}`}
                          fontSize={16}
                          fill="#ffffff"
                          fontStyle="bold"
                          listening={false}
                        />
                        
                        {/* Dimension info */}
                        <Rect
                          x={x}
                          y={y + height + 8}
                          width={180}
                          height={28}
                          fill="rgba(29, 78, 216, 0.9)"
                          cornerRadius={4}
                          listening={false}
                        />
                        <KonvaText
                          x={x + 10}
                          y={y + height + 14}
                          text={`Max size: ${widthInches}" × ${heightInches}"`}
                          fontSize={13}
                          fill="#ffffff"
                          listening={false}
                        />
                        
                        {/* Instruction text */}
                        <KonvaText
                          x={CANVAS_SIZE / 2}
                          y={y + height + 45}
                          text="Keep artwork inside blue boundary"
                          fontSize={12}
                          fill="#6b7280"
                          align="center"
                          width={CANVAS_SIZE}
                          offsetX={CANVAS_SIZE / 2}
                          listening={false}
                        />
                      </>
                    );
                  })()}

                  {getCurrentImages().map((image: ImageShape, i: number) => (
                    <CanvasImage
                      key={i}
                      shapeProps={image}
                      isSelected={image.id === selectedId}
                      onSelect={() => {
                        selectShape(image.id);
                      }}
                      onChange={(newAttrs) => {
                        const imgs = getCurrentImages().slice();
                        imgs[i] = newAttrs;
                        updateCurrentImages(imgs);
                      }}
                    />
                  ))}
                  {getCurrentTexts().map((text: TextShape, i: number) => (
                    <CanvasText
                      key={i}
                      shapeProps={text}
                      isSelected={text.id === selectedId}
                      onSelect={() => {
                        selectShape(text.id);
                      }}
                      onChange={(newAttrs) => {
                        const txts = getCurrentTexts().slice();
                        txts[i] = newAttrs;
                        updateCurrentTexts(txts);
                      }}
                    />
                  ))}
                </Layer>
              </Stage>
              {isMockupLoading && (
                <div
                  aria-live="polite"
                  aria-busy="true"
                  className="absolute inset-0 bg-white/80 flex items-center justify-center z-20"
                >
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-3"></div>
                    <p className="font-bold text-gray-800">Generating mockup…</p>
                    <p className="text-sm text-gray-600">This can take a few seconds.</p>
                  </div>
                </div>
              )}
            </div>


            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleGenerateMockup}
                disabled={isMockupLoading || !hasDesignElements}
                title={!hasDesignElements ? 'Add artwork or text to generate a mockup' : 'Generate product mockups for all placements with designs'}
                className={`px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all ${
                  isMockupLoading || !hasDesignElements
                    ? 'bg-gray-300 cursor-not-allowed opacity-50'
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                }`}
              >
                {isMockupLoading ? 'Generating…' : 'Generate All Mockups'}
              </button>
              
              {/* View Gallery Button - Only show if there are mockups */}
              {Object.keys(mockupCache).some(key => key !== 'outline' && mockupCache[key]) && (
                <button
                  onClick={() => setShowGalleryModal(true)}
                  className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all bg-purple-600 hover:bg-purple-700 hover:scale-105"
                >
                  📸 View All Angles
                </button>
              )}
              
              {!hasDesignElements && (
                <span className="text-sm text-amber-600 font-medium">
                  ⚠️ Add artwork or text to enable mockup generation
                </span>
              )}
              {mockupError && (
                <span className="text-sm text-red-500">
                  {mockupError}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Product Mockups - All Angles</h2>
              <button
                onClick={() => setShowGalleryModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(mockupCache)
                .filter(([key]) => key !== 'outline')
                .map(([placement, url]) => (
                  <div key={placement} className="bg-gray-50 rounded-lg p-4 shadow-md">
                    <div className="text-center mb-3">
                      <h3 className="text-lg font-bold text-purple-600">
                        {placementLabels[placement] || placement}
                      </h3>
                      {(() => {
                        const data = placementData[placement];
                        const hasDesigns = data && (data.images.length > 0 || data.texts.length > 0);
                        return !hasDesigns ? (
                          <div className="text-xs text-gray-500 mt-1">
                            📐 Transparent placeholder
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex justify-center mb-4">
                      <img
                        src={url as string}
                        alt={`${placement} mockup`}
                        className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
                      />
                    </div>
                    <div className="flex justify-center gap-3 flex-wrap">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = url as string;
                          link.download = `mockup-${placement}-${productId}-${variantId}.jpg`;
                          link.click();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={async () => { await handleSaveDesign(); }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        💾 Save design
                      </button>
                      <button
                        onClick={() => setShowGalleryModal(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        ← Go back and edit
                      </button>
                      <button
                        onClick={async () => { await handleAddToCart(); }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        🛒 Add to cart
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            
            {Object.keys(mockupCache).filter(key => key !== 'outline').length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No mockups generated yet.</p>
                <p className="text-sm">Generate mockups to see them here.</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowGalleryModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mockup Modal */}
      {showMockupModal && generatedMockupUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Your Product Mockup</h2>
              <button
                onClick={() => setShowMockupModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="text-center">
              <img
                src={generatedMockupUrl}
                alt="Generated Product Mockup"
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow-lg"
              />
              
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => {
                    // Use this mockup as the background
                    updateMockupCache(currentPlacement, generatedMockupUrl);
                    setShowMockupModal(false);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Use as Background
                </button>
                <button
                  onClick={() => {
                    // Download the image
                    const link = document.createElement('a');
                    link.href = generatedMockupUrl;
                    link.download = `mockup-${productId}-${variantId}.jpg`;
                    link.click();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Mockup
                </button>
                <button
                  onClick={() => setShowMockupModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DesignPage;
