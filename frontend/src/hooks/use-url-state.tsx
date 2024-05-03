'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function useURLState({
  formDefaults,
}: {
  formDefaults: { param: string; defaultValue: string }[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const paramNames = formDefaults.map((arg) => arg.param);

  function getDefaultURL() {
    const defaultFormData = new FormData();
    for (const { param, defaultValue } of formDefaults) {
      defaultFormData.set(param, defaultValue);
    }
    return getNewURL(defaultFormData);
  }

  function getNewURL(formData: FormData) {
    const newSearchParams = new URLSearchParams(searchParams);
    for (const [key, value] of formData.entries()) {
      if (typeof value !== 'string') {
        continue;
      }
      if (value === '') {
        newSearchParams.delete(key);
        continue;
      }
      if (!paramNames.includes(key)) {
        console.error(`Invalid key: ${key} Valid keys: `, paramNames);
        continue;
      }
      newSearchParams.set(key, value);
    }
    return `${pathname}?${newSearchParams.toString()}`;
  }

  function formToURLState(form: HTMLFormElement | null) {
    const formData = new FormData(form || undefined);
    const newURL = getNewURL(formData);
    router.push(newURL);
    router.refresh();
  }

  return {
    searchParams,
    paramNames,
    getNewURL,
    formToURLState,
    getDefaultURL,
  };
}
