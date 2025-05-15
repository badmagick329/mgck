import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AutoCropper - Smart Image Cropping Made Easy',
  description:
    'Automatically remove unwanted solid colors or gradients from your images with AutoCropper. Clean up your photos effortlessly.',

  keywords: [
    'image cropping tool',
    'remove background',
    'auto crop images',
    'solid color removal',
    'gradient removal',
    'image editing app',
    'background eraser',
    'photo cropping online',
    'clean image edges',
    'image cropper',
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
