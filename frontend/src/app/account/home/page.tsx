import {
  ACCEPTED_USER_ROLE,
  ADMIN_ROLE,
  NEW_USER_ROLE,
} from '@/lib/consts/account';
import { redirect } from 'next/navigation';
import { ACCOUNT_LOGIN } from '@/lib/consts/urls';
import AdminHome from '@/app/account/home/_components/AdminHome';
import UserHome from '@/app/account/home/_components/UserHome';
import { getAccountFollowing } from '@/actions/kpop-following';
import { getAllShortenedUrls } from '@/actions/urlshortener';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';

export default async function Home() {
  const session = await getVerifiedCoreSession();
  if (!session) {
    redirect(ACCOUNT_LOGIN);
  }
  const { role, username } = session;

  if (role === ADMIN_ROLE) {
    return <AdminHome username={username} />;
  }

  if (role === ACCEPTED_USER_ROLE) {
    const [shortenerResult, followingResult] = await Promise.all([
      getAllShortenedUrls(),
      getAccountFollowing(),
    ]);

    return (
      <UserHome
        username={username}
        isApproved
        shortenedUrls={shortenerResult.urls}
        followedArtistCount={
          followingResult.type === 'ok'
            ? followingResult.data.artists.length
            : undefined
        }
      />
    );
  }

  if (role === NEW_USER_ROLE)
    return <UserHome username={username} isApproved={false} />;

  redirect(ACCOUNT_LOGIN);
}
