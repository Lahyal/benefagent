import { SUPABASE_URL } from './supabase.generated';

export const AI_AGENT_URL = `${SUPABASE_URL}/functions/v1/ai-agent`;
export const DELETE_ACCOUNT_URL = `${SUPABASE_URL}/functions/v1/delete-account`;

/** Set in RevenueCat dashboard — paste keys before store release */
export const REVENUECAT_API_KEY_IOS = 'appl_mVHuwdxzhEsrKZUAKiuTnxZJzca';
export const REVENUECAT_API_KEY_ANDROID = '';

export const REVENUECAT_ENTITLEMENT_ID = 'pro';

export const LEGAL = {
  privacy: 'https://www.benefagent.com/privacy.html',
  terms: 'https://www.benefagent.com/terms.html',
  website: 'https://www.benefagent.com',
  contactEmail: 'contact@lahyal.com',
  appStore: 'https://apps.apple.com/us/app/benefagent-benefits-finder/id6781089266',
};

export function featureSuggestionMailto() {
  const subject = encodeURIComponent('BenefAgent feature suggestion');
  return `mailto:${LEGAL.contactEmail}?subject=${subject}`;
}
