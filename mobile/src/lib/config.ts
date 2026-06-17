import { SUPABASE_URL } from './supabase.generated';

export const AI_AGENT_URL = `${SUPABASE_URL}/functions/v1/ai-agent`;

/** Set in RevenueCat dashboard — paste keys before store release */
export const REVENUECAT_API_KEY_IOS = '';
export const REVENUECAT_API_KEY_ANDROID = '';

export const REVENUECAT_ENTITLEMENT_ID = 'pro';

export const LEGAL = {
  privacy: 'https://benefagent.com/privacy.html',
  terms: 'https://benefagent.com/terms.html',
  website: 'https://benefagent.com',
  supportEmail: 'support@benefagent.com',
};
