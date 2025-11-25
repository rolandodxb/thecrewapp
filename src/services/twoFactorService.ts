import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import * as speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface TwoFactorData {
  secret: string;
  enabled: boolean;
  backupCodes: string[];
}

export const twoFactorService = {
  async generateSecret(userId: string, userEmail: string): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: `Crews Academy (${userEmail})`,
      issuer: 'Crews Academy',
      length: 32
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    await setDoc(doc(db, 'twoFactor', userId), {
      secret: secret.base32,
      enabled: false,
      backupCodes: this.generateBackupCodes(),
      createdAt: new Date().toISOString()
    });

    return {
      secret: secret.base32,
      qrCode
    };
  },

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  },

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const twoFactorDoc = await getDoc(doc(db, 'twoFactor', userId));

    if (!twoFactorDoc.exists()) {
      return false;
    }

    const data = twoFactorDoc.data() as TwoFactorData;

    const verified = speakeasy.totp.verify({
      secret: data.secret,
      encoding: 'base32',
      token,
      window: 2
    });

    return verified;
  },

  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    const verified = await this.verifyToken(userId, token);

    if (verified) {
      await updateDoc(doc(db, 'twoFactor', userId), {
        enabled: true,
        enabledAt: new Date().toISOString()
      });
      return true;
    }

    return false;
  },

  async disableTwoFactor(userId: string, token: string): Promise<boolean> {
    const verified = await this.verifyToken(userId, token);

    if (verified) {
      await updateDoc(doc(db, 'twoFactor', userId), {
        enabled: false,
        disabledAt: new Date().toISOString()
      });
      return true;
    }

    return false;
  },

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const twoFactorDoc = await getDoc(doc(db, 'twoFactor', userId));

    if (!twoFactorDoc.exists()) {
      return false;
    }

    const data = twoFactorDoc.data() as TwoFactorData;
    return data.enabled;
  },

  async getBackupCodes(userId: string): Promise<string[]> {
    const twoFactorDoc = await getDoc(doc(db, 'twoFactor', userId));

    if (!twoFactorDoc.exists()) {
      return [];
    }

    const data = twoFactorDoc.data() as TwoFactorData;
    return data.backupCodes || [];
  },

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const twoFactorDoc = await getDoc(doc(db, 'twoFactor', userId));

    if (!twoFactorDoc.exists()) {
      return false;
    }

    const data = twoFactorDoc.data() as TwoFactorData;
    const codeIndex = data.backupCodes.indexOf(code.toUpperCase());

    if (codeIndex !== -1) {
      data.backupCodes.splice(codeIndex, 1);
      await updateDoc(doc(db, 'twoFactor', userId), {
        backupCodes: data.backupCodes,
        lastBackupCodeUsed: new Date().toISOString()
      });
      return true;
    }

    return false;
  }
};
