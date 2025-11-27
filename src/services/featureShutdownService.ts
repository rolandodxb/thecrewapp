import { supabase } from '../lib/auth';

export type FeatureKey =
  | 'chat'
  | 'modules'
  | 'submodules'
  | 'courses'
  | 'videos'
  | 'quizzes'
  | 'exams'
  | 'notifications'
  | 'certificateSystem'
  | 'communityChat'
  | 'pointsSystem'
  | 'fileUpload'
  | 'profileEdit';

export interface FeatureShutdown {
  featureKey: FeatureKey;
  isShutdown: boolean;
  shutdownReason: string;
  maintenanceMessage: string;
  maintenanceEndsAt: Date | null;
  updatedBy: string;
  updatedAt: Date;
}

export interface FeatureShutdownData {
  [key: string]: FeatureShutdown;
}

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  chat: 'Private Chat',
  modules: 'Training Modules',
  submodules: 'Submodules',
  courses: 'Courses',
  videos: 'Video Player',
  quizzes: 'Quizzes',
  exams: 'Exams',
  notifications: 'Notifications',
  certificateSystem: 'Certificates',
  communityChat: 'Community Chat',
  pointsSystem: 'Points System',
  fileUpload: 'File Upload',
  profileEdit: 'Profile Editing'
};

async function addAuditLog(action: string, details: any, performedBy: string) {
  try {
    await supabase.from('audit_logs').insert({
      action,
      details,
      performed_by: performedBy,
      timestamp: new Date().toISOString(),
      category: 'FEATURE_SHUTDOWN'
    });
  } catch (error) {
    console.error('Failed to add audit log:', error);
  }
}

export async function getFeatureShutdownStatus(featureKey: FeatureKey): Promise<FeatureShutdown | null> {
  try {
    const { data, error } = await supabase
      .from('feature_shutdowns')
      .select('*')
      .eq('feature_key', featureKey)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      featureKey: data.feature_key,
      isShutdown: data.is_shutdown,
      shutdownReason: data.shutdown_reason,
      maintenanceMessage: data.maintenance_message,
      maintenanceEndsAt: data.maintenance_ends_at ? new Date(data.maintenance_ends_at) : null,
      updatedBy: data.updated_by,
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error getting feature shutdown status:', error);
    return null;
  }
}

export async function getAllFeatureShutdowns(): Promise<FeatureShutdownData> {
  try {
    const { data, error } = await supabase
      .from('feature_shutdowns')
      .select('*');

    if (error) throw error;
    if (!data) return {};

    const result: FeatureShutdownData = {};
    data.forEach((row: any) => {
      result[row.feature_key] = {
        featureKey: row.feature_key,
        isShutdown: row.is_shutdown,
        shutdownReason: row.shutdown_reason,
        maintenanceMessage: row.maintenance_message,
        maintenanceEndsAt: row.maintenance_ends_at ? new Date(row.maintenance_ends_at) : null,
        updatedBy: row.updated_by,
        updatedAt: new Date(row.updated_at)
      };
    });

    return result;
  } catch (error: any) {
    console.error('Error getting all feature shutdowns:', error);
    return {};
  }
}

export function subscribeToFeatureShutdowns(
  callback: (shutdowns: FeatureShutdownData) => void
): () => void {
  const channel = supabase
    .channel('feature-shutdowns')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'feature_shutdowns',
      },
      () => {
        getAllFeatureShutdowns().then(callback);
      }
    )
    .subscribe();

  getAllFeatureShutdowns().then(callback);

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function activateFeatureShutdown(
  featureKey: FeatureKey,
  shutdownReason: string,
  maintenanceMessage: string,
  maintenanceEndsAt: Date,
  performedBy: string
): Promise<void> {
  try {
    const safePerformedBy = performedBy || 'UNKNOWN';

    const { error } = await supabase
      .from('feature_shutdowns')
      .upsert({
        feature_key: featureKey,
        is_shutdown: true,
        shutdown_reason: shutdownReason,
        maintenance_message: maintenanceMessage,
        maintenance_ends_at: maintenanceEndsAt.toISOString(),
        updated_by: safePerformedBy,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'feature_key'
      });

    if (error) throw error;

    await addAuditLog(
      'FEATURE_SHUTDOWN_ACTIVATED',
      {
        featureKey,
        shutdownReason,
        maintenanceMessage,
        maintenanceEndsAt: maintenanceEndsAt.toISOString()
      },
      safePerformedBy
    );
  } catch (error) {
    console.error('Error activating feature shutdown:', error);
    throw error;
  }
}

export async function deactivateFeatureShutdown(
  featureKey: FeatureKey,
  performedBy: string
): Promise<void> {
  try {
    const safePerformedBy = performedBy || 'UNKNOWN';

    const { error } = await supabase
      .from('feature_shutdowns')
      .update({
        is_shutdown: false,
        updated_by: safePerformedBy,
        updated_at: new Date().toISOString()
      })
      .eq('feature_key', featureKey);

    if (error) throw error;

    await addAuditLog(
      'FEATURE_SHUTDOWN_DEACTIVATED',
      { featureKey },
      safePerformedBy
    );
  } catch (error) {
    console.error('Error deactivating feature shutdown:', error);
    throw error;
  }
}

export async function checkAndAutoRestoreFeatures(): Promise<void> {
  try {
    const shutdowns = await getAllFeatureShutdowns();
    const now = new Date();

    for (const [featureKey, shutdown] of Object.entries(shutdowns)) {
      if (
        shutdown.isShutdown &&
        shutdown.maintenanceEndsAt &&
        shutdown.maintenanceEndsAt < now
      ) {
        const { error } = await supabase
          .from('feature_shutdowns')
          .update({
            is_shutdown: false,
            updated_by: 'SYSTEM_AUTO_RESTORE',
            updated_at: new Date().toISOString()
          })
          .eq('feature_key', featureKey);

        if (error) throw error;

        await addAuditLog(
          'FEATURE_SHUTDOWN_AUTO_RESTORED',
          {
            featureKey,
            scheduledEndTime: shutdown.maintenanceEndsAt.toISOString()
          },
          'SYSTEM_AUTO_RESTORE'
        );
      }
    }
  } catch (error) {
    console.error('Error in auto-restore check:', error);
  }
}

export function startAutoRestoreScheduler(): () => void {
  const intervalId = setInterval(() => {
    checkAndAutoRestoreFeatures();
  }, 60000);

  checkAndAutoRestoreFeatures();

  return () => clearInterval(intervalId);
}
