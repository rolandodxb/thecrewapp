import { User } from '../context/AppContext';

export type Feature =
  | 'courses'
  | 'recruiters'
  | 'opendays'
  | 'simulator'
  | 'ai-trainer'
  | 'messages'
  | 'chat';

export interface FeatureAccess {
  allowed: boolean;
  requiresPlan: 'pro' | 'vip' | null;
  message?: string;
}

const FEATURE_REQUIREMENTS: Record<Feature, { minPlan: 'free' | 'pro' | 'vip'; message: string }> = {
  'courses': {
    minPlan: 'free',
    message: 'Access to courses is available to all users.'
  },
  'recruiters': {
    minPlan: 'pro',
    message: 'Upgrade to Pro or VIP to access recruiter profiles and connect with airlines.'
  },
  'opendays': {
    minPlan: 'pro',
    message: 'Upgrade to Pro or VIP to view and register for airline open days.'
  },
  'simulator': {
    minPlan: 'vip',
    message: 'Upgrade to VIP to access the Open Day Simulator and practice your interview skills.'
  },
  'ai-trainer': {
    minPlan: 'vip',
    message: 'Upgrade to VIP to access the AI Trainer for personalized coaching.'
  },
  'messages': {
    minPlan: 'pro',
    message: 'Upgrade to Pro or VIP to send private messages to mentors and other students.'
  },
  'chat': {
    minPlan: 'pro',
    message: 'Upgrade to Pro or VIP to access group chat and connect with the community.'
  }
};

const PLAN_HIERARCHY = {
  'free': 0,
  'pro': 1,
  'vip': 2
};

export function checkFeatureAccess(user: User | null, feature: Feature): FeatureAccess {
  if (!user) {
    return {
      allowed: false,
      requiresPlan: 'pro',
      message: 'Please log in to access this feature.'
    };
  }

  if (user.role === 'mentor' || user.role === 'governor') {
    return {
      allowed: true,
      requiresPlan: null
    };
  }

  const requirement = FEATURE_REQUIREMENTS[feature];
  const userPlanLevel = PLAN_HIERARCHY[user.plan];
  const requiredPlanLevel = PLAN_HIERARCHY[requirement.minPlan];

  if (userPlanLevel >= requiredPlanLevel) {
    return {
      allowed: true,
      requiresPlan: null
    };
  }

  return {
    allowed: false,
    requiresPlan: requirement.minPlan === 'free' ? 'pro' : requirement.minPlan as 'pro' | 'vip',
    message: requirement.message
  };
}

export function getAvailableFeatures(user: User | null): Feature[] {
  if (!user) return [];

  if (user.role === 'mentor' || user.role === 'governor') {
    return Object.keys(FEATURE_REQUIREMENTS) as Feature[];
  }

  return (Object.keys(FEATURE_REQUIREMENTS) as Feature[]).filter(feature => {
    const access = checkFeatureAccess(user, feature);
    return access.allowed;
  });
}

export function getLockedFeatures(user: User | null): Feature[] {
  if (!user) return Object.keys(FEATURE_REQUIREMENTS) as Feature[];

  if (user.role === 'mentor' || user.role === 'governor') {
    return [];
  }

  return (Object.keys(FEATURE_REQUIREMENTS) as Feature[]).filter(feature => {
    const access = checkFeatureAccess(user, feature);
    return !access.allowed;
  });
}
