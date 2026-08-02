import {
  emojifyLauncherAccess,
  shortenerLauncherAccess,
} from '@/lib/account/launcher-access';
import { getFilesUrl } from '@/lib/files/url';

const acceptedSession = {
  username: 'accepted',
  userId: 'accepted-id',
  role: 'AcceptedUser',
  expiresAt: 0,
  accessToken: 'test-access-token',
};

describe('launcher access', () => {
  it('directs logged-out users to account login for Shortener', () => {
    expect(shortenerLauncherAccess(null)).toEqual({
      action: {
        href: '/account/login?returnTo=%2Fshorten',
        label: 'Create account / Sign in',
      },
      status: 'Core account required',
    });
  });

  it('shows pending approval state for new users', () => {
    expect(shortenerLauncherAccess({ ...acceptedSession, role: 'NewUser' }).status).toBe('Awaiting approval');
  });

  it('unlocks Shortener and AI suggestions for accepted users', () => {
    expect(shortenerLauncherAccess(acceptedSession).action.href).toBe('/shorten');
    expect(emojifyLauncherAccess(acceptedSession).status).toBe('AI emoji suggestions unlocked');
  });

  it('targets Django Files locally and the proxied path in production', () => {
    expect(getFilesUrl('development')).toBe('http://localhost:8002/files/');
    expect(getFilesUrl('production')).toBe('/files/');
  });
});
