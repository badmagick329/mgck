import { notFound } from 'next/navigation';

export default async function ShortCodePage({
  params,
}: {
  params: { segments: string[] };
}) {
  return notFound();
}
