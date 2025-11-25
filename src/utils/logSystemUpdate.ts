import { updatesService } from '../services/updatesService';

export async function logSystemUpdate(
  type: 'feature' | 'fix' | 'improvement' | 'announcement',
  title: string,
  description: string,
  createdBy: string = 'system',
  options?: {
    version?: string;
    notifyUsers?: boolean;
  }
) {
  try {
    await updatesService.createUpdate({
      type,
      title,
      description,
      version: options?.version,
      createdBy,
      notifyUsers: options?.notifyUsers ?? true,
    });
    console.log(`System update logged: ${title}`);
  } catch (error) {
    console.error('Failed to log system update:', error);
  }
}

export const quickLog = {
  feature: (title: string, description: string, userId = 'system') =>
    logSystemUpdate('feature', title, description, userId, { notifyUsers: true }),

  fix: (title: string, description: string, userId = 'system') =>
    logSystemUpdate('fix', title, description, userId, { notifyUsers: false }),

  improvement: (title: string, description: string, userId = 'system') =>
    logSystemUpdate('improvement', title, description, userId, { notifyUsers: false }),

  announcement: (title: string, description: string, userId = 'system') =>
    logSystemUpdate('announcement', title, description, userId, { notifyUsers: true }),
};
