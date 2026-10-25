import type { Metadata } from 'next';

// Search titles once read like subject detection ("Smart Image Cropping");
// the tool only strips a surrounding solid or gradient border.
const title = 'AutoCropper: Remove Solid or Gradient Borders from Images';
const description =
  'Remove the solid color or gradient border around a picture, such as the background of a story screenshot. Cropping runs in your browser, so images are not uploaded.';

export const autoCropperMetadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/image-edit' },
  openGraph: { url: '/image-edit', title, description },
  twitter: { card: 'summary', title, description },
};
