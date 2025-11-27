import { supabase } from '../lib/auth';
export type FeatureSeverity = 'info' | 'low' | 'urgent' | 'critical';
export interface FeatureRestriction {
  enabled: boolean;
  severity?: FeatureSeverity;
  reason?: string;
  disabledAt?: string;
  availableAt?: string;
  estimatedDuration?: string;
}
export interface SystemFeatures {
  chat: FeatureRestriction;
  quiz: FeatureRestriction;
  englishTest: FeatureRestriction;
  profileEdit: FeatureRestriction;
  openDayModule: FeatureRestriction;
  courses: FeatureRestriction;
  aiTrainer: FeatureRestriction;
  recruiters: FeatureRestriction;
  openDays: FeatureRestriction;
  simulator: FeatureRestriction;
  messages: FeatureRestriction;
  leaderboard: FeatureRestriction;
  community: FeatureRestriction;
}
export interface SystemAnnouncement {
  active: boolean;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string | null;
}
export interface SystemControl {
  features: SystemFeatures;
  announcement: SystemAnnouncement;
  updatedBy?: string;
  updatedAt?: any;
}
const SYSTEM_CONTROL_DOC_ID = 'status';
export const getSystemControl = async (): Promise<SystemControl | null> => {
  try {
    const { data, error } = await supabase
      .from('system_control')
      .select('*')
      .eq('id', SYSTEM_CONTROL_DOC_ID)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      console.log('No system control entry found, creating default...');
      return await createDefaultSystemControl();
    }
    return data as SystemControl;
  } catch (error) {
    console.error('Error fetching system control:', error);
    return null;
  }
};
const createDefaultSystemControl = async (): Promise<SystemControl | null> => {
  try {
    const defaultFeature: FeatureRestriction = { enabled: true };
    const defaultControl: SystemControl = {
      features: {
        chat: defaultFeature,
        quiz: defaultFeature,
        englishTest: defaultFeature,
        profileEdit: defaultFeature,
        openDayModule: defaultFeature,
        courses: defaultFeature,
        aiTrainer: defaultFeature,
        recruiters: defaultFeature,
        openDays: defaultFeature,
        simulator: defaultFeature,
        messages: defaultFeature,
        leaderboard: defaultFeature,
        community: defaultFeature,
      },
      announcement: {
        active: false,
        message: '',
        type: 'info',
        timestamp: null,
      },
      updatedBy: 'system',
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('system_control')
      .insert({ id: SYSTEM_CONTROL_DOC_ID, ...defaultControl })
      .select()
      .single();

    if (error) throw error;
    console.log('Default system control created successfully');
    return data as SystemControl;
  } catch (error) {
    console.error('Error creating default system control:', error);
    return null;
  }
};
export const updateSystemControl = async (
  updates: Partial<SystemControl>,
  userId: string
): Promise<SystemControl | null> => {
  try {
    const updateData = {
      ...updates,
      updatedBy: userId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('system_control')
      .update(updateData)
      .eq('id', SYSTEM_CONTROL_DOC_ID)
      .select()
      .single();

    if (error) throw error;
    return data as SystemControl;
  } catch (error) {
    console.error('Error updating system control:', error);
    throw error;
  }
};
export const updateAnnouncement = async (
  announcement: Partial<SystemAnnouncement>,
  userId: string
): Promise<void> => {
  try {
    const systemControl = await getSystemControl();
    if (!systemControl) throw new Error('System control not found');
    const updatedAnnouncement = {
      ...systemControl.announcement,
      ...announcement,
    };
    await updateSystemControl({ announcement: updatedAnnouncement }, userId);
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};
export const subscribeToSystemControl = (
  callback: (control: SystemControl | null) => void
): (() => void) => {
  const channel = supabase
    .channel('system-control')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'system_control',
        filter: `id=eq.${SYSTEM_CONTROL_DOC_ID}`,
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as SystemControl);
        } else {
          callback(null);
        }
      }
    )
    .subscribe();

  getSystemControl().then(callback);

  return () => {
    supabase.removeChannel(channel);
  };
};
export const updateFeatureStatus = async (
  featureName: keyof SystemFeatures,
  restriction: FeatureRestriction,
  userId: string
): Promise<void> => {
  try {
    const systemControl = await getSystemControl();
    if (!systemControl) throw new Error('System control not found');
    const updatedFeatures = {
      ...systemControl.features,
      [featureName]: restriction,
    };
    await updateSystemControl({ features: updatedFeatures }, userId);
    console.log(`Feature ${featureName} updated:`, restriction);
  } catch (error) {
    console.error(`Error updating feature ${featureName}:`, error);
    throw error;
  }
};
export const isFeatureEnabled = (features: SystemFeatures, featureName: keyof SystemFeatures): boolean => {
  const feature = features[featureName];
  if (!feature) return true;
  return feature.enabled;
};
export const getFeatureRestriction = (features: SystemFeatures, featureName: keyof SystemFeatures): FeatureRestriction | null => {
  const feature = features[featureName];
  if (!feature || feature.enabled) return null;
  return feature;
};