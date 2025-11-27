import { supabase } from '../lib/auth';

export interface LoginActivity {
  id?: string;
  userId: string;
  timestamp: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  userAgent: string;
  success: boolean;
}

export async function recordLoginActivity(userId: string, success: boolean = true) {
  const deviceInfo = getDeviceInfo();
  let ipInfo: { ip?: string; location?: any } = {};

  try {
    ipInfo = await Promise.race([
      getIPInfo(),
      new Promise<{ ip?: string; location?: any }>((resolve) =>
        setTimeout(() => resolve({}), 2000)
      )
    ]);
  } catch (error) {
    console.warn('Could not fetch IP info, continuing without it');
  }

  const activity = {
    user_id: userId,
    timestamp: new Date().toISOString(),
    device_type: deviceInfo.deviceType,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    user_agent: navigator.userAgent,
    ip_address: ipInfo.ip || 'Unknown',
    location: ipInfo.location || {},
    success,
  };

  const { data, error } = await supabase
    .from('login_activity')
    .insert(activity)
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getUserLoginHistory(userId: string, limitCount: number = 10): Promise<LoginActivity[]> {
  const { data, error } = await supabase
    .from('login_activity')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limitCount);

  if (error) throw error;

  const activities = (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    timestamp: row.timestamp,
    deviceType: row.device_type,
    browser: row.browser,
    os: row.os,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    location: row.location,
    success: row.success
  }));

  try {
    const { data: userPointsData } = await supabase
      .from('user_points')
      .select('last_login')
      .eq('user_id', userId)
      .maybeSingle();

    if (userPointsData?.last_login) {
      const lastLoginTime = new Date(userPointsData.last_login).getTime();
      const deviceInfo = getDeviceInfo();

      const alreadyRecorded = activities.some(a =>
        Math.abs(new Date(a.timestamp).getTime() - lastLoginTime) < 60000
      );

      if (!alreadyRecorded) {
        activities.unshift({
          id: 'from_user_points',
          userId,
          timestamp: userPointsData.last_login,
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          userAgent: navigator.userAgent,
          success: true
        });
      }
    }
  } catch (error) {
    console.error('Error fetching from user_points:', error);
  }

  return activities.slice(0, limitCount);
}

export async function getRecentLogins(limitCount: number = 50): Promise<LoginActivity[]> {
  const { data, error } = await supabase
    .from('login_activity')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limitCount);

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    timestamp: row.timestamp,
    deviceType: row.device_type,
    browser: row.browser,
    os: row.os,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    location: row.location,
    success: row.success
  }));
}

export async function getFailedLoginAttempts(userId: string, since: Date): Promise<LoginActivity[]> {
  const { data, error } = await supabase
    .from('login_activity')
    .select('*')
    .eq('user_id', userId)
    .eq('success', false)
    .gte('timestamp', since.toISOString())
    .order('timestamp', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    timestamp: row.timestamp,
    deviceType: row.device_type,
    browser: row.browser,
    os: row.os,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    location: row.location,
    success: row.success
  }));
}

export async function deleteLoginActivity(activityId: string) {
  const { error } = await supabase
    .from('login_activity')
    .delete()
    .eq('id', activityId);

  if (error) throw error;
}

export async function clearOldLoginActivity(userId: string, olderThanDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { data, error } = await supabase
    .from('login_activity')
    .delete()
    .eq('user_id', userId)
    .lt('timestamp', cutoffDate.toISOString())
    .select('id');

  if (error) throw error;
  return data?.length || 0;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    deviceType = 'mobile';
  }

  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  return { deviceType, browser, os };
}

async function getIPInfo(): Promise<{ ip?: string; location?: any }> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return { ip: data.ip };
  } catch (error) {
    console.error('Error fetching IP info:', error);
    return {};
  }
}
