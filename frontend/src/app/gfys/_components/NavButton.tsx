import { Button } from '@/components/ui/button';
import { createURL } from '@/lib/gfys';
import Link from 'next/link';
import {
  ImArrowLeft,
  ImArrowRight,
  ImBackward2,
  ImForward3,
} from 'react-icons/im';

type IconType =
  | typeof ImArrowLeft
  | typeof ImArrowRight
  | typeof ImBackward2
  | typeof ImForward3;

type NavButtonProps = {
  url: string | null;
  nextURL: string | null;
  prevURL: string | null;
  totalPages: number;
  navType: NavType;
  leftRef: React.RefObject<HTMLAnchorElement> | null;
  rightRef: React.RefObject<HTMLAnchorElement> | null;
  pathname: string;
};

type NavType = 'first' | 'previous' | 'next' | 'last';
export default function NavButton({
  url,
  nextURL,
  prevURL,
  totalPages,
  navType,
  leftRef,
  rightRef,

  pathname,
}: NavButtonProps) {
  if (!nextURL && !prevURL) {
    return null;
  }

  let Icon: IconType = ImBackward2;
  let ref: React.RefObject<HTMLAnchorElement> | null = null;
  let asPage = null;
  switch (navType) {
    case 'first':
      Icon = ImBackward2;
      asPage = '1';
      break;
    case 'previous':
      Icon = ImArrowLeft;
      ref = leftRef;
      break;
    case 'next':
      Icon = ImArrowRight;
      ref = rightRef;
      break;
    case 'last':
      Icon = ImForward3;
      asPage = totalPages.toString();
      break;
  }

  if (url) {
    return (
      <Link ref={ref} href={createURL(pathname, url.split('?')[1], asPage)}>
        <Button
          className='bg-primary-gf/90 text-primary-gf-foreground hover:bg-primary-gf'
          variant='secondary'
        >
          <Icon />
        </Button>
      </Link>
    );
  }
  return (
    <Button
      className='bg-primary-gf/90 text-primary-gf-foreground'
      variant='secondary'
      disabled
    >
      <Icon />
    </Button>
  );
}
