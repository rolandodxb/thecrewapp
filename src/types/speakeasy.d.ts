declare module 'speakeasy' {
  export interface GenerateSecretOptions {
    name?: string;
    issuer?: string;
    length?: number;
  }

  export interface Secret {
    ascii: string;
    hex: string;
    base32: string;
    otpauth_url?: string;
  }

  export interface TOTPVerifyOptions {
    secret: string;
    encoding: string;
    token: string;
    window?: number;
  }

  export function generateSecret(options?: GenerateSecretOptions): Secret;

  export namespace totp {
    export function verify(options: TOTPVerifyOptions): boolean;
  }
}
