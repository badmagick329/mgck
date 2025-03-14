import { ReadonlyURLSearchParams } from 'next/navigation';

function getNextPage(totalPages: number, currentPage: number) {
  return currentPage < totalPages ? currentPage + 1 : null;
}

function getPreviousPage(currentPage: number) {
  return currentPage > 1 ? currentPage - 1 : null;
}

function getValidPageNumber(pageValue: string | null) {
  if (!pageValue) return 1;
  const page = parseInt(pageValue);
  return isNaN(page) || page < 1 ? 1 : page;
}

export function getPreviousPageURL(
  searchParams: ReadonlyURLSearchParams,
  pathname: string
): string | null {
  const pageInURL = searchParams.get('page');
  const pageInURLNumber = getValidPageNumber(pageInURL);
  const previousPage = getPreviousPage(pageInURLNumber);
  if (previousPage === null) {
    return null;
  }

  const newSearchParams = new URLSearchParams(searchParams.toString());
  if (previousPage !== 1) {
    newSearchParams.set('page', previousPage.toString());
  } else {
    newSearchParams.delete('page');
  }
  return `${pathname}?${newSearchParams.toString()}`;
}

export function getNextPageURL(
  searchParams: ReadonlyURLSearchParams,
  pathname: string,
  totalPages: number
): string | null {
  const pageInURL = searchParams.get('page');
  const pageInURLNumber = getValidPageNumber(pageInURL);
  const nextPage = getNextPage(totalPages, pageInURLNumber);
  if (nextPage === null) {
    return null;
  }

  const newSearchParams = new URLSearchParams(searchParams.toString());
  newSearchParams.set('page', nextPage.toString());
  return `${pathname}?${newSearchParams.toString()}`;
}

export function hasNextPage(
  searchParams: ReadonlyURLSearchParams,
  totalPages: number
) {
  const pageInURL = searchParams.get('page');
  const pageInURLNumber = getValidPageNumber(pageInURL);
  return pageInURLNumber < totalPages;
}

export function hasPreviousPage(searchParams: ReadonlyURLSearchParams) {
  const pageInURL = searchParams.get('page');
  const pageInURLNumber = getValidPageNumber(pageInURL);
  return pageInURLNumber > 1;
}
