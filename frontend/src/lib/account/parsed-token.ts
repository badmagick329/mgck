import { jwtDecode } from 'jwt-decode';
import { cookies } from 'next/headers';
import 'server-only';

export type JWTPayload = {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string;
  role: string;
  exp: number;
};

export class ParsedToken {
  private _token: string = '';
  private _name: string = '';
  private _role: string = '';
  private _exp: number = 0;
  private _success: boolean = false;

  constructor(token?: string) {
    if (!token) return;

    this._token = token;
    const parsed = this.parsed();
    if (!parsed) {
      this._success = false;
      return;
    }

    this._success = true;
    this._name =
      parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
    this._role = parsed.role;
    this._exp = parsed.exp;
  }

  public static createFromCookie = () => {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    return new ParsedToken(token);
  };

  isExpiring = () => {
    if (!this._success) {
      return true;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return this._exp < currentTime + 10;
  };

  name = () => this._name;
  role = () => this._role;
  exp = () => this._exp;
  success = () => this._success;

  private parsed = (): JWTPayload | null => {
    try {
      return jwtDecode<JWTPayload>(this._token);
    } catch (error) {
      return null;
    }
  };
}
