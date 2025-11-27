import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TwoFactorSettings {
  enabled: boolean;
  email: string;
  backupCodes: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VerificationCode {
  code: string;
  expiresAt: Timestamp;
  attempts: number;
}

export const twoFactorAuthService = {
  async enable2FA(userId: string, email: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes(10);
    const hashedCodes = backupCodes.map(code => this.hashCode(code));

    const settings: TwoFactorSettings = {
      enabled: true,
      email,
      backupCodes: hashedCodes,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const settingsRef = doc(db, 'users', userId, 'security_settings', '2fa');
    await setDoc(settingsRef, settings);

    return backupCodes;
  },

  async disable2FA(userId: string): Promise<void> {
    const settingsRef = doc(db, 'users', userId, 'security_settings', '2fa');
    await updateDoc(settingsRef, {
      enabled: false,
      updatedAt: Timestamp.now()
    });
  },

  async is2FAEnabled(userId: string): Promise<boolean> {
    const settingsRef = doc(db, 'users', userId, 'security_settings', '2fa');
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      return settingsDoc.data().enabled === true;
    }
    return false;
  },

  async get2FASettings(userId: string): Promise<TwoFactorSettings | null> {
    const settingsRef = doc(db, 'users', userId, 'security_settings', '2fa');
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      return settingsDoc.data() as TwoFactorSettings;
    }
    return null;
  },

  async createVerificationCode(userId: string): Promise<string> {
    const code = this.generateSixDigitCode();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));

    const verificationData: VerificationCode = {
      code,
      expiresAt,
      attempts: 0
    };

    const verificationRef = doc(db, 'users', userId, 'security_settings', 'verification');
    await setDoc(verificationRef, verificationData);

    return code;
  },

  async verifyCode(userId: string, code: string): Promise<boolean> {
    const verificationRef = doc(db, 'users', userId, 'security_settings', 'verification');
    const verificationDoc = await getDoc(verificationRef);

    if (!verificationDoc.exists()) {
      return false;
    }

    const data = verificationDoc.data() as VerificationCode;

    if (data.attempts >= 3) {
      return false;
    }

    if (data.expiresAt.toMillis() < Date.now()) {
      return false;
    }

    if (data.code === code) {
      await updateDoc(verificationRef, { attempts: 0 });
      return true;
    }

    await updateDoc(verificationRef, { attempts: data.attempts + 1 });
    return false;
  },

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const settingsRef = doc(db, 'users', userId, 'security_settings', '2fa');
    const settingsDoc = await getDoc(settingsRef);

    if (!settingsDoc.exists()) {
      return false;
    }

    const settings = settingsDoc.data() as TwoFactorSettings;
    const hashedCode = this.hashCode(code);

    const index = settings.backupCodes.indexOf(hashedCode);
    if (index !== -1) {
      const updatedCodes = [...settings.backupCodes];
      updatedCodes.splice(index, 1);

      await updateDoc(settingsRef, {
        backupCodes: updatedCodes,
        updatedAt: Timestamp.now()
      });

      return true;
    }

    return false;
  },

  generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

  hashCode(code: string): string {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
};
