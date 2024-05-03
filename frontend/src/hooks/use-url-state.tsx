'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function useURLState({ formKeys }: { formKeys: string[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function getNewURL(formData: FormData) {
    const newSearchParams = new URLSearchParams(searchParams);

    for (const [key, value] of formData.entries()) {
      if (typeof value !== 'string' || value === undefined) {
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

  function formDataToURLState(formData: FormData) {
    const newURL = getNewURL(formData);
    router.replace(newURL);
    router.refresh();
  }

  return {
    searchParams,
    paramNames: formKeys,
    getNewURL,
    formDataToURLState,
    router,
    pathname,
  };
}
