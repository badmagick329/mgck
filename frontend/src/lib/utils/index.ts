import { useToast } from '@/components/ui/use-toast';
import { type ClassValue, clsx } from 'clsx';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { twMerge } from 'tailwind-merge';

type ToastType = ReturnType<typeof useToast>['toast'];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'absolute';
  textArea.style.left = '-999999px';
  document.body.prepend(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  } finally {
    textArea.remove();
  }
  return Promise.resolve();
}

/**
 * Take a YYMMDD, YYYYMMDD or YYYY-MM-DD string and return a YYYY-MM-DD string
 * or null if invalid.
 */
export function validDateStringOrNull(date: string) {
  date = date.trim();
  if (date.length !== 6 && date.length !== 8 && date.length !== 10) {
    return null;
  }
  if (date.length === 6) {
    date = `20${date}`;
  }

  if (date.length === 8) {
    date = date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  }

  if (isNaN(Date.parse(date))) {
    return null;
  }
  return date;
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function handleCopyToClipboard(text: string, toast: ToastType) {
  try {
    await copyToClipboard(text);
    topRightDefaultToast('Copied to clipboard', toast);
  } catch (error) {
    topRightDefaultToast('Failed to copy to clipboard', toast);
  }
}

export function searchParamsToFormData(
  searchParams: ReadonlyURLSearchParams | URLSearchParams
) {
  const formData = new FormData();
  for (const [key, value] of searchParams) {
    formData.append(key, value);
  }
  return formData;
}

export function truncateText(text: string, max: number = 28) {
  return text.length > max - 3 ? `${text.slice(0, max)}...` : text;
}

export function capitaliseWords(text: string) {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function topRightDefaultToast(
  text: string,
  toast: ToastType,
  duration = 1000,
  variant: 'default' | 'destructive' | null | undefined = 'default'
) {
  toast({
    className: cn(
      'fixed right-0 top-0 flex md:right-4 md:top-4 md:max-w-[420px]'
    ),
    variant,
    description: text,
    duration,
  });
}

export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
