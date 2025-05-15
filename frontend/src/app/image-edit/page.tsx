'use client';

import { Button } from '@/components/ui/button';
import Navbar from '@/app/_components/Navbar';
import Footer from '@/app/_components/Footer';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import NextImage from 'next/image';

export default function ImageEditPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; filename: string }[]>(
    []
  );
  const [cropped, setCropped] = useState<{ url: string; filename: string }[]>(
    []
  );
  const [isCropping, setIsCropping] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((f) => [...f, ...accepted]);
    setCropped([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      let newFilesAdded = false;
      for (const item of Array.from(e.clipboardData?.files || [])) {
        if (item.type.startsWith('image/')) {
          setFiles((f) => [...f, item]);
          newFilesAdded = true;
        }
      }
      newFilesAdded && setCropped([]);
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, []);

  useEffect(() => {
    const previews = files.map((f) => ({
      url: URL.createObjectURL(f),
      filename: f.name,
    }));
    setPreviews(previews);
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [files]);

  return (
    <main className='flex min-h-dvh w-full flex-col items-center bg-background-dg'>
      <Navbar />
      <div className='container mx-auto flex w-full flex-grow flex-col items-center gap-12 px-4 py-6'>
        <h1 className='rounded-md border-2 border-primary-dg bg-secondary-dg px-4 py-2 text-xl shadow-glow-primary-dg'>
          Auto crop solid color or gradient around images
        </h1>
        <div
          {...getRootProps({ className: 'dropzone' })}
          className={clsx(
            'flex flex-col items-center gap-4 bg-secondary-dg',
            'rounded-md px-6 py-8 hover:cursor-pointer',
            `shadow-glow-secondary-dg`,
            `transition-all`
          )}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className='text-lg font-medium'>Drop images here…</p>
          ) : (
            <p className='text-lg font-medium'>
              Drag & drop, click to select, or paste (Ctrl+V) an image
            </p>
          )}
          {previews.length > 0 && (
            <div className='mt-6 flex flex-wrap justify-center gap-4'>
              {previews.map((preview, index) => (
                <NextImage
                  key={index}
                  src={preview.url}
                  width={96}
                  height={96}
                  className='h-24 w-24 rounded object-cover'
                  alt={preview.filename}
                />
              ))}
            </div>
          )}
        </div>

        {previews.length > 0 && (
          <div className='flex flex-col items-center gap-2'>
            <p className='text-sm text-muted-foreground'>
              {previews.length} image{previews.length > 1 ? 's' : ''} ready to
              crop
            </p>
            <Button
              onClick={() =>
                handleCrop({
                  setIsCropping,
                  previews,
                  setFiles,
                  setCropped,
                })
              }
              className='bg-primary-dg font-semibold text-primary-foreground shadow-glow-primary-dg hover:bg-primary-dg/90'
              disabled={isCropping || cropped.length > 0}
            >
              Crop Images
            </Button>
          </div>
        )}

        {cropped.length > 0 && (
          <div className='flex w-full flex-col gap-4'>
            <h2 className='text-center text-lg font-medium'>Cropped Results</h2>
            <div className='flex flex-wrap justify-center gap-4'>
              {cropped.map((item) => (
                <div key={item.url} className='flex flex-col'>
                  <a
                    href={item.url}
                    download={item.filename}
                    className='relative h-96 w-96 rounded-lg bg-secondary-dg hover:bg-secondary-dg/80 hover:opacity-80'
                  >
                    <NextImage
                      unoptimized
                      src={item.url}
                      fill
                      className='rounded-lg object-contain hover:opacity-80'
                      alt={item.filename}
                    />
                  </a>
                </div>
              ))}
              <div className='flex w-full flex-col justify-center gap-4'>
                <p className='text-center text-sm text-muted-foreground'>
                  Click any cropped image to download it individually, or use
                  "Download all" to save all images at once.
                </p>
                <div className='flex w-full justify-center gap-4'>
                  <Button
                    className='bg-primary-dg font-semibold text-primary-foreground shadow-glow-primary-dg hover:bg-primary-dg/90'
                    onClick={() => {
                      cropped.forEach((item) => {
                        const a = document.createElement('a');
                        a.href = item.url;
                        a.download = item.filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      });
                    }}
                  >
                    Download all
                  </Button>
                  <Button
                    onClick={() => {
                      setCropped([]);
                      setFiles([]);
                    }}
                    className='shadow-glow-destructive bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90'
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

function autoCropImage(img: HTMLImageElement, threshold = 15): string {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const midHeight = Math.floor(height / 2);
  const GRAD_STEP = 20;
  const ADDITIONAL_CROP = 5;

  const tmp = document.createElement('canvas');
  tmp.width = width;
  tmp.height = height;
  const tctx = tmp.getContext('2d')!;
  tctx.drawImage(img, 0, 0);

  const imgData = tctx.getImageData(0, 0, width, height);
  const { data } = imgData;

  const getPixelAt = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const arePixelsSimilar = (
    pixel1: number[],
    pixel2: number[],
    threshold: number
  ) => {
    for (let i = 0; i < 3; i++) {
      if (Math.abs(pixel1[i] - pixel2[i]) > threshold) {
        return false;
      }
    }
    return true;
  };

  const computeRowStdDev = (y: number, channel: number) => {
    let sum = 0;
    let sumSq = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4 + channel;
      const val = data[i];
      sum += val;
      sumSq += val * val;
    }
    const mean = sum / width;
    return Math.sqrt(sumSq / width - mean * mean);
  };

  const findTopYForCrop = () => {
    let topY = 0;
    for (let y = midHeight; y > 0; y--) {
      const rStd = computeRowStdDev(y, 0);
      const gStd = computeRowStdDev(y, 1);
      const bStd = computeRowStdDev(y, 2);

      if (rStd < threshold && gStd < threshold && bStd < threshold) {
        topY = y + ADDITIONAL_CROP;
        break;
      }
    }
    return topY;
  };

  const findBottomYForCrop = () => {
    let bottomY = height;
    for (let y = midHeight; y < height; y++) {
      const rStd = computeRowStdDev(y, 0);
      const gStd = computeRowStdDev(y, 1);
      const bStd = computeRowStdDev(y, 2);

      if (rStd < threshold && gStd < threshold && bStd < threshold) {
        bottomY = y - ADDITIONAL_CROP;
        break;
      }
    }
    return bottomY;
  };

  const findLeftXForCrop = (topY: number, bottomY: number) => {
    let leftX = width - 2;
    for (let y = topY; y < bottomY; y += GRAD_STEP) {
      let x = 0;
      while (x < width - 2 && x < leftX) {
        if (
          !arePixelsSimilar(getPixelAt(0, y), getPixelAt(x + 1, y), threshold)
        ) {
          leftX = x;
          break;
        }
        x += 1;
      }
    }
    return leftX === width - 2 ? 0 : leftX + ADDITIONAL_CROP;
  };

  const findRightXForCrop = (topY: number, bottomY: number) => {
    let rightX = 0;
    for (let y = topY; y < bottomY; y += GRAD_STEP) {
      let x = width - 1;
      while (x > 2 && x > rightX) {
        if (
          !arePixelsSimilar(
            getPixelAt(width - 1, y),
            getPixelAt(x - 1, y),
            threshold
          )
        ) {
          rightX = x;
          break;
        }
        x -= 1;
      }
    }
    return rightX === 0 ? width - 1 : rightX - ADDITIONAL_CROP;
  };

  const topY = findTopYForCrop();
  const bottomY = findBottomYForCrop();
  const leftX = findLeftXForCrop(topY, bottomY);
  const rightX = findRightXForCrop(topY, bottomY);

  const cropW = rightX - leftX;
  const cropH = bottomY - topY;

  const out = document.createElement('canvas');
  out.width = cropW;
  out.height = cropH;
  const octx = out.getContext('2d')!;
  octx.drawImage(
    tmp,
    leftX,
    topY,
    cropW,
    cropH, // source rect
    0,
    0,
    cropW,
    cropH // dest rect
  );

  return out.toDataURL();
}

const handleCrop = async ({
  setIsCropping,
  previews,
  setFiles,
  setCropped,
}: {
  setIsCropping: (isCropping: boolean) => void;
  previews: { url: string; filename: string }[];
  setFiles: (files: File[]) => void;
  setCropped: (cropped: { url: string; filename: string }[]) => void;
}) => {
  const results: { url: string; filename: string }[] = [];
  try {
    setIsCropping(true);
    await Promise.all(
      previews.map(
        (preview) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              results.push({
                url: autoCropImage(img),
                filename:
                  preview.filename.replace(/\.[^/.]+$/, '') + '_cropped.png',
              });
              resolve();
            };
            img.src = preview.url;
          })
      )
    );
    setFiles([]);
  } catch (error) {
    console.error('Error cropping images:', error);
  } finally {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setIsCropping(false);
  }
  setCropped(results);
};
