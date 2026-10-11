/** @jest-environment node */
import { getSafeReturnTo } from '@/lib/account/return-to';
import { ACCOUNT_USER_HOME } from '@/lib/consts/urls';

describe('getSafeReturnTo', () => {
  it.each(['/kpop', '/kpop?view=following', '/gfys/abc#t=3', '/accounts'])(
    'keeps the on-site path %s',
    (value) => {
      expect(getSafeReturnTo(value)).toBe(value);
    }
  );

  it('returns the normalised path that was validated', () => {
    expect(getSafeReturnTo('/a/../kpop')).toBe('/kpop');
  });

  it.each([
    [null],
    [undefined],
    [''],
    ['kpop'],
    ['https://evil.com'],
    ['//evil.com'],
    ['/\\evil.com'],
    ['/\\\\evil.com'],
    ['\\/evil.com'],
    ['/\t/evil.com'],
    ['/\n/evil.com'],
    ['/\r\n/evil.com'],
    ['/.//evil.com'],
    ['%2F%2Fevil.com'],
  ])('rejects the off-site destination %j', (value) => {
    expect(getSafeReturnTo(value)).toBe(ACCOUNT_USER_HOME);
  });

  it.each(['/account', '/account/login', '/account?x=1', '/x/../account/home'])(
    'rejects the account-loop destination %s',
    (value) => {
      expect(getSafeReturnTo(value)).toBe(ACCOUNT_USER_HOME);
    }
  );
});
