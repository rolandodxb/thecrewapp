import * as OTPAuth from 'otpauth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import QRCode from 'qrcode';

interface TOTPSecret {
  secret: string;
  enabled: boolean;
  createdAt: string;
  backupCodes?: string[];
}

export const totpService = {
  generateSecret(): { secret: string; uri: string } {
    const totp = new OTPAuth.TOTP({
      issuer: 'Emirates Academy',
      label: 'User',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    return {
      secret: totp.secret.base32,
      uri: totp.toString(),
    };
  },

  async generateQRCode(uri: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(uri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  },

  verifyToken(secret: string, token: string): boolean {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'Emirates Academy',
        label: 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      const delta = totp.validate({ token, window: 1 });
      return delta !== null;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  },

  async enable2FA(
    userId: string,
    email: string,
    secret: string
  ): Promise<string[]> {
    const backupCodes = this.generateBackupCodes(10);

    const totpData: TOTPSecret = {
      secret,
      enabled: true,
      createdAt: new Date().toISOString(),
      backupCodes,
    };

    const totpRef = doc(db, 'users', userId, 'twoFactorAuth', 'settings');
    await setDoc(totpRef, totpData);

    return backupCodes;
  },

  async disable2FA(userId: string): Promise<void> {
    const totpRef = doc(db, 'users', userId, 'twoFactorAuth', 'settings');
    await deleteDoc(totpRef);
  },

  async check2FAStatus(userId: string): Promise<boolean> {
    try {
      const totpRef = doc(db, 'users', userId, 'twoFactorAuth', 'settings');
      const totpDoc = await getDoc(totpRef);

      if (totpDoc.exists()) {
        const data = totpDoc.data() as TOTPSecret;
        return data.enabled === true;
      }

      return false;
    } catch (error) {
      console.error('Error checking 2FA status');
      return false;
    }
  },

  async getSecret(userId: string): Promise<string | null> {
    const totpRef = doc(db, 'users', userId, 'twoFactorAuth', 'settings');
    const totpDoc = await getDoc(totpRef);

    if (totpDoc.exists()) {
      const data = totpDoc.data() as TOTPSecret;
      return data.secret;
    }

    return null;
  },

  async verifyUserToken(userId: string, token: string): Promise<boolean> {
    const secret = await this.getSecret(userId);
    if (!secret) return false;

    return this.verifyToken(secret, token);
  },

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const totpRef = doc(db, 'users', userId, 'twoFactorAuth', 'settings');
    const totpDoc = await getDoc(totpRef);

    if (!totpDoc.exists()) return false;

    const data = totpDoc.data() as TOTPSecret;
    if (!data.backupCodes) return false;

    const index = data.backupCodes.indexOf(code);
    if (index !== -1) {
      const updatedCodes = [...data.backupCodes];
      updatedCodes.splice(index, 1);

      await setDoc(
        totpRef,
        { backupCodes: updatedCodes },
        { merge: true }
      );

      return true;
    }

    return false;
  },

  generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateRandomCode(8);
      codes.push(code);
    }
    return codes;
  },

  generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },
};
