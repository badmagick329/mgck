/**
 * @jest-environment node
 */
import { metadata as homeLayoutMetadata } from '@/app/account/home/layout';
import { metadata as accountMetadata } from '@/app/account/layout';
import { metadata as loginLayoutMetadata } from '@/app/account/login/layout';
import { metadata as filesRequestAccessMetadata } from '@/app/files/request-access/page';

jest.mock('../lib/account/verified-session', () => ({
  getVerifiedCoreSession: jest.fn(),
}));
jest.mock('../app/files/request-access/request-form', () => () => null);
jest.mock('../app/_components/Navbar', () => () => null);
jest.mock('../app/_components/Footer', () => () => null);
jest.mock('../components/ui/toaster', () => ({ Toaster: () => null }));

const NOINDEX = { index: false, follow: false };

test('every account page inherits noindex from the account layout', () => {
  expect(accountMetadata.robots).toEqual(NOINDEX);
  // A nested layout setting `robots` would replace the inherited value.
  expect(homeLayoutMetadata).not.toHaveProperty('robots');
  expect(loginLayoutMetadata).not.toHaveProperty('robots');
});

test('the files access request form is noindex', () => {
  expect(filesRequestAccessMetadata.robots).toEqual(NOINDEX);
});
