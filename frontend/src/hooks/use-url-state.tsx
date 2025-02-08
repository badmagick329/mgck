'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function useURLState({ formKeys }: { formKeys: string[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function getNewURL(
    formData: FormData,
    oldSearchParams: URLSearchParams = new URLSearchParams(
      searchParams.toString()
    )
  ) {
    const newSearchParams = new URLSearchParams(oldSearchParams);

    for (const [key, value] of formData.entries()) {
      if (typeof value !== 'string') {
        continue;
      }
      if (value === '') {
        newSearchParams.delete(key);
        continue;
      }
      if (!formKeys.includes(key)) {
        console.error(`Invalid key: ${key} Valid keys: `, formKeys);
        continue;
      }
      newSearchParams.set(key, value);
    }
    return `${pathname}?${newSearchParams.toString()}`;
  }

  function formDataToURLState(
    formData: FormData,
    searchParams?: URLSearchParams
  ) {
    const newURL = getNewURL(formData, searchParams);
    router.replace(newURL);
    router.refresh();
  }

  function clearURLState() {
    const newURL = pathname;
    router.replace(newURL);
    router.refresh();
  }

  return {
    searchParams,
    formKeys,
    formDataToURLState,
    router,
    pathname,
    clearURLState,
  };
}
