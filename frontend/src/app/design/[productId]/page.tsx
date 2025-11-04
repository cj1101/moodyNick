'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Rect, Line } from 'react-konva';
import useImage from 'use-image';
import { config } from '@/config/api';
import { authenticatedFetch, handleAuthError } from '@/utils/auth';
import Konva from 'konva';
import { usePricing } from '@/state/pricing/pricingStore';
import PostMockupActions from '@/components/design/PostMockupActions';

// Silence verbose logs in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    const noop = () => {};
    // @ts-expect-error - Intentionally overriding console methods
    console.log = noop;
    // @ts-expect-error - Intentionally overriding console methods
    console.debug = noop;
  } catch {}
}

const CANVAS_SIZE = 800;

interface ImageShape {
  id: string;
  type: string;
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
}

interface TextShape {
  id: string;
  type: string;
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
  _id: string;
  imageUrl: string;
}

interface PrintAreaInfo {
  placement: string;
  areaWidth: number;
  areaHeight: number;
}

interface ProductVariant {
  id: number;
  [key: string]: unknown;
}

interface Product {
  sync_product?: {
    name: string;
  };
  sync_variants?: ProductVariant[];
}

// ... (DraggableImage, CanvasImage, CanvasText components remain the same) ...
const DraggableImage = ({ src }: { src: string }) => {
    return (
      <img
        src={src}
        alt="artwork"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', ''); // Required for Firefox
          e.dataTransfer.setData('imageSrc', src);
        }}
        style={{ 
          width: '100%', 
          height: 'auto', 
          cursor: 'grab',
          display: 'block',
          borderRadius: '4px'
        }}
      />
    );
  };
  
  const CanvasImage = ({ shapeProps, isSelected, onSelect, onChange }: {
    shapeProps: ImageShape;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newAttrs: ImageShape) => void;
  }) => {
    const shapeRef = useRef<Konva.Image>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const [image] = useImage(shapeProps.src, 'anonymous');
  
    useEffect(() => {
      if (isSelected && trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer()?.batchDraw();
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
          draggable
          onDragEnd={(e) => {
            onChange({
              ...shapeProps,
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onTransformEnd={() => {
            const node = shapeRef.current;
            if (!node) return;
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
  
  const CanvasText = ({ shapeProps, isSelected, onSelect, onChange }: {
    shapeProps: TextShape;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newAttrs: TextShape) => void;
  }) => {
      const shapeRef = useRef<Konva.Text>(null);
      const trRef = useRef<Konva.Transformer>(null);
    
      useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
          trRef.current.nodes([shapeRef.current]);
          trRef.current.getLayer()?.batchDraw();
        }
      }, [isSelected]);
    
      return (
        <>
          <KonvaText
            onClick={onSelect}
            onTap={onSelect}
            ref={shapeRef}
            {...shapeProps}
            draggable
            onDragEnd={(e) => {
              onChange({
                ...shapeProps,
                x: e.target.x(),
                y: e.target.y(),
              });
            }}
            onTransformEnd={() => {
              const node = shapeRef.current;
              if (!node) return;
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

  // Preview component for rendering images in the live mockup
  const PreviewImage = ({ shapeProps, scale }: { shapeProps: ImageShape; scale: number }) => {
    const [image] = useImage(shapeProps.src, 'anonymous');
    
    return (
      <KonvaImage
        x={shapeProps.x * scale}
        y={shapeProps.y * scale}
        width={(shapeProps.width || 100) * scale}
        height={(shapeProps.height || 100) * scale}
        rotation={shapeProps.rotation || 0}
        image={image}
      />
    );
  };

  // Function to export only artwork content without background
  const exportArtworkOnly = async (images: ImageShape[], texts: TextShape[]): Promise<string> => {
    
    if (images.length === 0 && texts.length === 0) {
      // No artwork: return minimal transparent square
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
    
    [...images, ...texts].forEach((element, index) => {
      const x = element.x;
      const y = element.y;
      const width = element.width || 100;
      const height = element.height || 100;
      
      // Calculate bounds for each element
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // Bounding box computed

    // Ensure minimum dimensions for Printful compatibility
    const minWidth = 300; // Increased minimum width for better visibility
    const minHeight = 300; // Increased minimum height for better visibility
    const padding = 40; // Increased padding
    const artworkWidth = Math.max(minWidth, maxX - minX + (padding * 2));
    const artworkHeight = Math.max(minHeight, maxY - minY + (padding * 2));

    // Final artwork dimensions

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
        // Add image to export stage
        const tempImage = new Konva.Image({
          x: imageShape.x - minX + padding,
          y: imageShape.y - minY + padding,
          width: imageShape.width || 100,
          height: imageShape.height || 100,
          rotation: imageShape.rotation || 0,
          image: await loadImage(imageShape.src),
        });
        tempLayer.add(tempImage);
        // Image added
      } catch (error) {
        console.warn('Failed to load image for export:', imageShape.src, error);
      }
    }

    // Add texts to temp layer
    for (const textShape of texts) {
      // Add text to export stage
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
      // Text added
    }

    // Export the clean artwork with transparent background
    const dataUrl = tempStage.toDataURL({ pixelRatio: 2 });
    // Export complete
    
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
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const productId = params?.productId as string;
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [productMockup, setProductMockup] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [printArea, setPrintArea] = useState<PrintAreaInfo | null>(null);
  const [currentPlacement, setCurrentPlacement] = useState<string>('front');
  
  // Store images and texts per placement
  const [placementImages, setPlacementImages] = useState<Record<string, ImageShape[]>>({ front: [] });
  const [placementTexts, setPlacementTexts] = useState<Record<string, TextShape[]>>({ front: [] });
  
  // Get current placement's images and texts
  const images = placementImages[currentPlacement] || [];
  const texts = placementTexts[currentPlacement] || [];
  
  const [selectedId, selectShape] = useState<string | null>(null);
  const [isMockupLoading, setIsMockupLoading] = useState(false);
  const [mockupError, setMockupError] = useState<string | null>(null);
  const [showPrintGuide, setShowPrintGuide] = useState(true);
  const { setInputs, setContinueHandler } = usePricing();
  const [showPostActions, setShowPostActions] = useState(false);
  // Pricing sync: base from product/variant selection; extra placements from content count
  useEffect(() => {
    const basePrice = (product && (product as unknown as { retail_price?: string }).retail_price)
      ? parseFloat(String((product as unknown as { retail_price?: string }).retail_price)) || 0
      : 0;
    const currency = (product && (product as unknown as { currency?: string }).currency) || 'USD';

    const placementsWithContent = Object.keys(placementImages).filter((k: string) => {
      const imgs = placementImages[k] as ImageShape[] | undefined;
      const txts = placementTexts[k] as TextShape[] | undefined;
      return (imgs?.length || 0) > 0 || (txts?.length || 0) > 0;
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
  }, [product, placementImages, placementTexts, setInputs]);

  // Provide sticky continue handler: generate mockup then open actions
  useEffect(() => {
    const fn = async () => {
      await handleGenerateMockup();
      setShowPostActions(true);
    };
    setContinueHandler(fn);
    return () => setContinueHandler(undefined);
  }, [setContinueHandler, selectedVariantId, placementImages, placementTexts]);
  const stageRef = useRef<Konva.Stage>(null);

  // Keep UI silent in production

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const res = await fetch(config.endpoints.artwork);
        if(res.ok) {
          const data = await res.json();
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
        const res = await fetch(`${config.endpoints.products}/${productId}`);
        if(res.ok) {
          const data = await res.json();
          setProduct(data);
          
          // Get the first variant's mockup if available
          if (data.sync_variants && data.sync_variants.length > 0) {
            const firstVariant = data.sync_variants[0];
            setSelectedVariantId(firstVariant.id);

            await fetchPrintAreaInfo(productId, firstVariant.id);
            const blankLoaded = await generateInitialBlankMockup(productId, firstVariant.id);

            if (!blankLoaded) {
              // Fallback to catalog assets if blank mockup fails
              // Prioritize flat product images, avoid model/lifestyle images
              let mockupUrl: string | null = null;

              // Priority 1: Look for flat/default product files (not preview/model images)
              interface ProductFile {
                type?: string;
                preview_url?: string;
                thumbnail_url?: string;
                url?: string;
                [key: string]: unknown;
              }
              if (!mockupUrl && firstVariant.files && firstVariant.files.length > 0) {
                const flatFile = (firstVariant.files as ProductFile[]).find((f: ProductFile) => 
                  f.type === 'default' || 
                  f.type === 'flat' || 
                  f.type === 'front' ||
                  f.type === 'back'
                );
                  if (flatFile) {
                  mockupUrl = flatFile.preview_url || flatFile.thumbnail_url || flatFile.url;
                }
              }

              // Priority 2: Product thumbnail (usually flat)
              if (!mockupUrl && data.sync_product?.thumbnail_url) {
                mockupUrl = data.sync_product.thumbnail_url;
              }

              // Priority 3: Generic product image
              if (!mockupUrl && data.product?.image) {
                mockupUrl = data.product.image;
              }

              // Do NOT fall back to preview images - they show models/lifestyle shots
              // Only use if absolutely nothing else is available

              if (mockupUrl) {
                // Use variant asset as fallback
                setProductMockup(mockupUrl);
              } else {
                console.warn('No flat assets available; leaving canvas blank.');
                setProductMockup(null);
              }
            }
          }
        } else {
          console.error("Failed to fetch product");
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    
    const fetchPrintAreaInfo = async (prodId: string, variantId: number) => {
      try {
        const res = await fetch(`${config.apiUrl}/api/catalog/products/${prodId}/printfiles?variantId=${variantId}`);
        if (!res.ok) {
          console.error('Failed to fetch print files', res.status);
          return;
        }

        const data = await res.json();
        interface PlacementData {
          placement?: string;
          print_area?: {
            area_width?: number;
            area_height?: number;
            width?: number;
            height?: number;
            print_area_width?: number;
            print_area_height?: number;
          };
          printfile?: {
            area_width?: number;
            area_height?: number;
            width?: number;
            height?: number;
            print_area_width?: number;
            print_area_height?: number;
          };
          area_width?: number;
          area_height?: number;
          width?: number;
          height?: number;
          print_area_width?: number;
          print_area_height?: number;
          [key: string]: unknown;
        }
        const placements = (data?.printfiles || data?.variant_printfiles || []) as PlacementData[];
        const primaryPlacement = placements.find((placement: PlacementData) => placement?.placement === 'front') || placements[0];

        if (primaryPlacement?.placement) {
          const area = primaryPlacement.print_area || primaryPlacement.printfile || primaryPlacement;
          const areaWidth = area?.area_width || area?.width || area?.print_area_width;
          const areaHeight = area?.area_height || area?.height || area?.print_area_height;

          if (areaWidth && areaHeight) {
            setPrintArea({
              placement: primaryPlacement.placement,
              areaWidth,
              areaHeight,
            });
            setShowPrintGuide(true);
            // Selected print area set
          }
        }
      } catch (error) {
        console.error('Error fetching print area info:', error);
      }
    };

    const generateInitialBlankMockup = async (prodId: string, variantId: number): Promise<boolean> => {
      try {
        const response = await fetch(`${config.apiUrl}/api/catalog/products/${prodId}/blank-mockup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ variantId, placement: 'front' }),
        });

        if (!response.ok) {
          console.error('Failed to generate initial blank mockup', response.status);
          return false;
        }

        const data = await response.json();
        if (data?.mockup_url) {
          setProductMockup(data.mockup_url);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error generating initial blank mockup:', error);
        return false;
      }
    };

    fetchArtwork();
    fetchProduct();
  }, [productId]);

  const hasDesignElements = images.length > 0 || texts.length > 0;

  const handleGenerateMockup = async () => {
    if (!selectedVariantId) {
      setMockupError('Variant information is not ready yet.');
      return;
    }

    if (!stageRef.current) {
      setMockupError('Design canvas is not ready.');
      return;
    }

    // Get the current images and texts from state at the start of the function
    const currentImages = placementImages[currentPlacement] || [];
    const currentTexts = placementTexts[currentPlacement] || [];

    try {
      setIsMockupLoading(true);
      setMockupError(null);

      // Begin mockup generation

      // Temporarily hide print area guidelines during export
      const stage = stageRef.current;
      
      // Find and hide print area elements by their blue stroke color
      interface KonvaNode {
        getAttr: (attr: string) => string | number | undefined;
        hide: () => void;
      }
      const printAreaElements: KonvaNode[] = [];
      
      // Hide rectangles with blue stroke (#3b82f6) and blue fill
      stage.find('Rect').forEach((rect: KonvaNode) => {
        if (rect.getAttr('stroke') === '#3b82f6' || rect.getAttr('fill') === '#3b82f6') {
          printAreaElements.push(rect);
          rect.hide();
        }
      });
      
      // Hide triangular line elements with blue stroke
      stage.find('Line').forEach((line: KonvaNode) => {
        if (line.getAttr('stroke') === '#2563eb' || line.getAttr('stroke') === '#3b82f6') {
          printAreaElements.push(line);
          line.hide();
        }
      });
      
      // Hide text elements that are part of print area labels
      stage.find('Text').forEach((text: KonvaNode) => {
        if (text.getAttr('fill') === '#ffffff' && text.getAttr('fontSize') === 14) {
          printAreaElements.push(text);
          text.hide();
        }
      });
      
      // Export only the artwork content (images and texts) without background
      const designDataUrl = await exportArtworkOnly(currentImages, currentTexts);
      
      // Show print area guidelines again
      printAreaElements.forEach((element) => {
        element.show();
      });

      // Calculate artwork bounding box to get actual dimensions
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      [...currentImages, ...currentTexts].forEach(element => {
        const x = element.x;
        const y = element.y;
        const width = element.width || 100;
        const height = element.height || 100;
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      });

      const artworkWidth = Math.max(100, maxX - minX);
      const artworkHeight = Math.max(100, maxY - minY);

      // Compute print-area relative position in Printful pixels
      const defaultPrintArea: PrintAreaInfo = { placement: 'front', areaWidth: 3600, areaHeight: 4800 };
      const activePrintArea = printArea || defaultPrintArea;
      // Rebuild the same rect used in render
      const REFERENCE_MAX_DIMENSION = 4800;
      const MAX_CANVAS_DISPLAY = CANVAS_SIZE * 0.6;
      const scaleRatio = MAX_CANVAS_DISPLAY / REFERENCE_MAX_DIMENSION;
      let rectW = (activePrintArea.areaWidth || 3600) * scaleRatio;
      let rectH = (activePrintArea.areaHeight || 4800) * scaleRatio;
      const maxFit = 0.7;
      if (rectW > CANVAS_SIZE * maxFit || rectH > CANVAS_SIZE * maxFit) {
        const excessScale = Math.max(rectW / (CANVAS_SIZE * maxFit), rectH / (CANVAS_SIZE * maxFit));
        rectW = rectW / excessScale;
        rectH = rectH / excessScale;
      }
      const xRect = (CANVAS_SIZE - rectW) / 2;
      const yRect = (CANVAS_SIZE - rectH) / 2 - (CANVAS_SIZE * 0.05);

      const relLeft = (minX - xRect) / rectW;
      const relTop = (minY - yRect) / rectH;
      const relWidth = artworkWidth / rectW;
      const relHeight = artworkHeight / rectH;

      let targetWidthPx = Math.round(relWidth * (activePrintArea.areaWidth || 3600));
      let targetHeightPx = Math.round(relHeight * (activePrintArea.areaHeight || 4800));
      const widthScale = (activePrintArea.areaWidth || 3600) / Math.max(1, targetWidthPx);
      const heightScale = (activePrintArea.areaHeight || 4800) / Math.max(1, targetHeightPx);
      const fitScale = Math.min(1, Math.min(widthScale, heightScale));
      targetWidthPx = Math.round(targetWidthPx * fitScale);
      targetHeightPx = Math.round(targetHeightPx * fitScale);
      let leftPx = Math.round(relLeft * (activePrintArea.areaWidth || 3600));
      let topPx = Math.round(relTop * (activePrintArea.areaHeight || 4800));
      leftPx = Math.max(0, Math.min((activePrintArea.areaWidth || 3600) - targetWidthPx, leftPx));
      topPx = Math.max(0, Math.min((activePrintArea.areaHeight || 4800) - targetHeightPx, topPx));

      const requestBody = {
        variantId: selectedVariantId,
        placements: [{
          placement: printArea?.placement || 'front',
          designDataUrl,
          artworkDimensions: {
            width: artworkWidth,
            height: artworkHeight
          },
          position: {
            left: leftPx,
            top: topPx,
            width: targetWidthPx,
            height: targetHeightPx
          }
        }]
      };

      // Requesting 2D flat mockup

      const response = await fetch(`${config.apiUrl}/api/catalog/products/${productId}/mockup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.message || 'Failed to generate mockup. Please try again.';
        throw new Error(message);
      }

      const generatedMockup = data?.mockups?.[0]?.mockup_url || data?.mockups?.[0]?.url;
      if (generatedMockup) {
        setProductMockup(generatedMockup);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred while generating the mockup.';
      setMockupError(message);
    } finally {
      setIsMockupLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!stageRef.current) return;
    stageRef.current.setPointersPositions(e.nativeEvent);
    const imageSrc = e.dataTransfer.getData('imageSrc');
    if (imageSrc) {
        const position = stageRef.current.getPointerPosition();
        setPlacementImages((prev) => {
          const currentImages = prev[currentPlacement] || [];
          const newImage: ImageShape = {
              x: position?.x || 100,
              y: position?.y || 100,
              src: imageSrc,
              id: `image${currentImages.length + 1}_${currentPlacement}`,
              type: 'image',
              width: 200,  // Increased default width for better visibility
              height: 200, // Increased default height for better visibility
          };
          // Update placement images with dropped asset
          const updated = {
            ...prev,
            [currentPlacement]: [...currentImages, newImage]
          };
          // State updated
          return updated;
        });
    }
  };

  const addText = () => {
    setPlacementTexts((prev) => {
      const currentTexts = prev[currentPlacement] || [];
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
      return {
        ...prev,
        [currentPlacement]: [...currentTexts, newText]
      };
    });
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlacementTexts((prev) => {
      const currentTexts = prev[currentPlacement] || [];
      const selectedTextIndex = currentTexts.findIndex(t => t.id === selectedId);
      if(selectedTextIndex !== -1) {
          const newTexts = currentTexts.slice();
          newTexts[selectedTextIndex] = {
              ...newTexts[selectedTextIndex],
              [name]: name === 'fontSize' ? parseInt(value) : value
          };
          return {
            ...prev,
            [currentPlacement]: newTexts
          };
      }
      return prev;
    });
  }

  const handleSaveDesign = async () => {
    const pvId = selectedVariantId ? Number(selectedVariantId) : 0;
    const designData = {
        productId: parseInt(String(productId || '0'), 10),
        productVariantId: pvId,
        // Persist per-placement maps so we can restore editor state later
        placements: {
            images: placementImages,
            texts: placementTexts
        }
    };

    try {
        const res = await authenticatedFetch(config.endpoints.designs, {
            method: 'POST',
            body: JSON.stringify(designData)
        }, router);

        if(res.ok) {
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

      interface ImageWithUrl {
        url?: string;
        [key: string]: unknown;
      }
      const preview = (Array.isArray(placementImages) && placementImages.length > 0 && (placementImages[0] as ImageWithUrl)?.url) || '';

      const item = {
        id: `custom-${productId}-${Date.now()}`,
        type: 'custom_design' as const,
        productId: String(productId),
        productVariantId: selectedVariantId ? Number(selectedVariantId) : 0,
        name: 'Custom product',
        quantity: 1,
        price: '0.00',
        image: String(preview || ''),
        design: {
          images: placementImages,
          texts: placementTexts,
          files: preview ? [{ url: String(preview) }] : []
        }
      };

      const updated = Array.isArray(existing) ? [...existing, item] : [item];
      localStorage.setItem('cart', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      alert('Design added to cart!');
      window.location.href = '/cart';
    } catch (e) {
      console.error('Failed to add to cart', e);
      alert('Sorry, we could not add this to your cart.');
    }
  };

  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const selectedText = texts.find(t => t.id === selectedId);

  return (
    <div style={{ display: 'flex', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Left Sidebar - Clipart Gallery */}
      <div style={{ 
        width: '280px', 
        backgroundColor: 'white',
        borderRight: '1px solid #e0e0e0', 
        padding: '20px', 
        overflowY: 'auto', 
        height: '100vh',
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginTop: 0, 
          marginBottom: '16px',
          color: '#333'
        }}>Clipart</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          {artworks.map((art) => (
            <div key={art._id} style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '8px',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s',
              cursor: 'grab'
            }}>
              <DraggableImage src={art.imageUrl} />
            </div>
          ))}
        </div>
        
        <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '20px 0' }} />
        
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          marginBottom: '12px',
          color: '#333'
        }}>Tools</h3>
        <button 
          onClick={addText} 
          style={{ 
            display: 'block', 
            width: '100%', 
            marginBottom: '10px', 
            padding: '10px 16px',
            cursor: 'pointer',
            backgroundColor: 'white',
            border: '1px solid #d0d0d0',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          ✏️ Add Text
        </button>
        
        {selectedText && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginTop: 0, marginBottom: '12px' }}>Edit Text</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>Text:</label>
              <input 
                type="text" 
                name="text" 
                value={selectedText.text} 
                onChange={handleTextChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #d0d0d0', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>Font Size:</label>
              <input 
                type="number" 
                name="fontSize" 
                value={selectedText.fontSize} 
                onChange={handleTextChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #d0d0d0', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>Font:</label>
              <input 
                type="text" 
                name="fontFamily" 
                value={selectedText.fontFamily} 
                onChange={handleTextChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #d0d0d0', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>Color:</label>
              <input 
                type="color" 
                name="fill" 
                value={selectedText.fill} 
                onChange={handleTextChange}
                style={{ 
                  width: '100%', 
                  height: '40px',
                  border: '1px solid #d0d0d0', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        )}
        
        <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '20px 0' }} />
        
        <button 
          onClick={handleSaveDesign} 
          style={{ 
            display: 'block', 
            width: '100%', 
            marginBottom: '10px', 
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          💾 Save Design
        </button>
        <button 
          onClick={handleAddToCart} 
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          🛒 Add to Cart
        </button>
      </div>

      {/* Center - Product Mockup Canvas */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        overflowY: 'auto'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1000px',
          marginBottom: '20px'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            margin: 0,
            color: '#1f2937'
          }}>
            {product?.sync_product?.name || 'Design Your Product'}
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280',
            margin: '8px 0 0 0'
          }}>
            Drag clipart from the left panel onto the product mockup
          </p>
        </div>

        {/* Main Design Canvas with Product Mockup */}
        <div 
          onDrop={handleDrop} 
          onDragOver={(e) => e.preventDefault()}
          style={{ 
            position: 'relative',
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}
        >
          {/* Product Mockup Background */}
          {productMockup && (
            <img 
              src={productMockup} 
              alt="Product mockup"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                pointerEvents: 'none',
                zIndex: 0
              }}
            />
          )}
          
          {/* Konva Canvas for Design Elements */}
          <Stage
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
            ref={stageRef}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Layer>
              {/* Print Area Guide */}
              {showPrintGuide && printArea && (
                (() => {
                  // Rendering print area guide
                  
                  const maxGuideWidth = CANVAS_SIZE * 0.8;
                  const maxGuideHeight = CANVAS_SIZE * 0.8;
                  const rawWidth = printArea.areaWidth;
                  const rawHeight = printArea.areaHeight;
                  const scale = Math.min(maxGuideWidth / rawWidth, maxGuideHeight / rawHeight, 1);
                  const width = rawWidth * scale;
                  const height = rawHeight * scale;
                  const x = (CANVAS_SIZE - width) / 2;
                  const y = (CANVAS_SIZE - height) / 2;
                  const trianglePoints = [
                    x + width / 2,
                    y,
                    x + width,
                    y + height,
                    x,
                    y + height,
                  ];

                  return (
                    <>
                      {/* Semi-transparent background rectangle */}
                      <Rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill="rgba(147, 197, 253, 0.15)"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dash={[10, 5]}
                        listening={false}
                      />
                      {/* Triangular artwork zone indicator */}
                      <Line
                        points={trianglePoints}
                        closed
                        fill="rgba(59, 130, 246, 0.25)"
                        stroke="#2563eb"
                        strokeWidth={2}
                        listening={false}
                      />
                      {/* Label */}
                      <Rect
                        x={x}
                        y={y - 35}
                        width={140}
                        height={28}
                        fill="#3b82f6"
                        cornerRadius={4}
                        listening={false}
                      />
                      <KonvaText
                        x={x + 10}
                        y={y - 28}
                        text="🎨 Artwork Zone"
                        fontSize={14}
                        fill="#ffffff"
                        fontStyle="bold"
                        listening={false}
                      />
                    </>
                  );
                })()
              )}
              
              {/* Design Elements */}
              {images.map((image, i) => (
                <CanvasImage
                  key={i}
                  shapeProps={image}
                  isSelected={image.id === selectedId}
                  onSelect={() => selectShape(image.id)}
                  onChange={(newAttrs) => {
                    setPlacementImages((prev) => {
                      const currentImages = prev[currentPlacement] || [];
                      const updatedImages = currentImages.slice();
                      updatedImages[i] = newAttrs;
                      return {
                        ...prev,
                        [currentPlacement]: updatedImages
                      };
                    });
                  }}
                />
              ))}
              {texts.map((text, i) => (
                <CanvasText
                  key={i}
                  shapeProps={text}
                  isSelected={text.id === selectedId}
                  onSelect={() => selectShape(text.id)}
                  onChange={(newAttrs) => {
                    setPlacementTexts((prev) => {
                      const currentTexts = prev[currentPlacement] || [];
                      const updatedTexts = currentTexts.slice();
                      updatedTexts[i] = newAttrs;
                      return {
                        ...prev,
                        [currentPlacement]: updatedTexts
                      };
                    });
                  }}
                />
              ))}
            </Layer>
          </Stage>
          {isMockupLoading && (
            <div
              aria-live="polite"
              aria-busy="true"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.85)',
                zIndex: 2,
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
                <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>Generating mockup…</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>This can take a few seconds.</div>
              </div>
            </div>
          )}
        </div>

        <PostMockupActions
          open={showPostActions}
          onClose={() => setShowPostActions(false)}
          onSave={async () => { await handleSaveDesign(); setShowPostActions(false); }}
          onEdit={() => setShowPostActions(false)}
          onAddToCart={async () => { await handleAddToCart(); setShowPostActions(false); }}
        />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '16px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowPrintGuide(prev => !prev)}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              border: '1px solid #d0d0d0',
              backgroundColor: showPrintGuide ? '#3b82f6' : 'white',
              color: showPrintGuide ? 'white' : '#1f2937',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!showPrintGuide) {
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }
            }}
            onMouseLeave={(e) => {
              if (!showPrintGuide) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            {showPrintGuide ? 'Hide Print Area' : 'Show Print Area'}
          </button>

          <button
            onClick={handleGenerateMockup}
            disabled={isMockupLoading || !selectedVariantId}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isMockupLoading || !selectedVariantId ? '#93c5fd' : '#1d4ed8',
              color: 'white',
              fontSize: '16px',
              fontWeight: 700,
              cursor: isMockupLoading || !selectedVariantId ? 'not-allowed' : 'pointer',
              opacity: isMockupLoading || !selectedVariantId ? 0.7 : 1,
              boxShadow: '0 10px 18px rgba(29, 78, 216, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            {isMockupLoading ? 'Generating…' : 'See Mockup'}
          </button>

          {!hasDesignElements && (
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Add artwork or text before generating a custom mockup.
            </span>
          )}

          {mockupError && (
            <span style={{ fontSize: '13px', color: '#dc2626' }}>
              {mockupError}
            </span>
          )}
        </div>

        {/* Helper Text */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          maxWidth: '800px',
          width: '100%'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '13px', 
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            💡 <strong>Tip:</strong> Drag clipart onto the product, click to select and resize, or add text to customize your design.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DesignPage;
