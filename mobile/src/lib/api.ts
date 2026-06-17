import { SUPABASE_ANON_KEY } from './supabase.generated';
import { AI_AGENT_URL } from './config';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

export type UserContext = {
  salary?: string | number | null;
  contrib?: string | number | null;
  family?: string;
  commute?: string;
  accounts?: string[];
  hasHSA?: boolean;
  hasFSA?: boolean;
};

export type BenefitAction = {
  title: string;
  description: string;
  estimated_annual_value?: number;
  priority?: string;
};

export type BenefitsResult = {
  employer?: string;
  summary?: string;
  total_opportunity?: number;
  '401k_match'?: string;
  hsa_available?: boolean;
  fsa_available?: boolean;
  fsa_limit?: number;
  commuter_benefit?: boolean;
  commuter_monthly_limit?: number;
  tuition_reimbursement?: number;
  gym_reimbursement?: number;
  dental?: boolean;
  vision?: boolean;
  actions?: BenefitAction[];
};

export type EligibilityResult = {
  eligible: 'yes' | 'partial' | 'no';
  verdict: string;
  explanation: string;
  conditions?: string;
  estimated_annual_savings?: number;
  irs_reference?: string;
};

export type ScanReceiptResult = {
  store?: string;
  total?: number;
  eligible_total?: number;
  summary?: string;
};

export async function callAgent<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(AI_AGENT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: T & { error?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text.slice(0, 200) || `Request failed (${res.status})`);
  }
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function analyzeBenefits(
  fileData: string,
  mediaType: string,
  userContext: UserContext,
): Promise<BenefitsResult> {
  return callAgent({
    action: 'analyze_benefits',
    fileData,
    mediaType,
    userContext,
  });
}

export async function checkEligibility(
  expense: string,
  accountType: string,
  userContext: UserContext,
): Promise<EligibilityResult> {
  return callAgent({
    action: 'check_eligibility',
    expense,
    accountType,
    userContext,
  });
}

export async function scanReceipt(
  fileData: string,
  mediaType: string,
  accountType: string,
  userContext: UserContext,
): Promise<ScanReceiptResult> {
  return callAgent<ScanReceiptResult>({
    action: 'scan_receipt',
    fileData,
    mediaType,
    accountType,
    userContext,
  });
}

export async function buildClaim(payload: Record<string, unknown>) {
  return callAgent({ action: 'build_claim', ...payload });
}
