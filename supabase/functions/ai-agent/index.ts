import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  buildDocumentContent,
  callAnthropic,
  handleOptions,
  jsonResponse,
  parseJsonFromText,
} from '../_shared/anthropic.ts';

const SYSTEMS: Record<string, string> = {
  analyze_benefits: `You are an expert employee benefits analyst. Return ONLY valid JSON with employer, summary, total_opportunity, 401k_match, hsa_available, fsa_available, fsa_limit, commuter_benefit, commuter_monthly_limit, tuition_reimbursement, gym_reimbursement, and actions array (title, description, estimated_annual_value, priority).`,

  check_eligibility: `You are an HSA/FSA eligibility expert. Return ONLY JSON:
{"eligible":"yes"|"partial"|"no","verdict":"short line","explanation":"2-3 sentences","conditions":"","estimated_annual_savings":0,"irs_reference":""}`,

  scan_receipt: `You read receipts for HSA/FSA claims. Return ONLY JSON:
{"merchant":"","date":"","amount":0,"description":"","eligible":"yes"|"partial"|"no","verdict":"","explanation":"","account_type":""}`,

  build_claim: `You build HSA/FSA reimbursement claim forms. Return ONLY JSON:
{"claim_number":"CLM-XXXX","claimant":"","member_id":"","employer":"","account_type":"","submission_date":"","line_items":[{"date":"","provider":"","description":"","amount":0}],"total_amount":0,"submission_instructions":""}`,
};

serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    const body = await req.json();
    const action = body.action as string;
    if (!action || !SYSTEMS[action]) {
      return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }

    let userContent: unknown;

    if (action === 'analyze_benefits' || action === 'scan_receipt') {
      const { fileData, mediaType, userContext, accountType } = body;
      if (!fileData || !mediaType) {
        return jsonResponse({ error: 'fileData and mediaType required' }, 400);
      }
      const extra = action === 'scan_receipt'
        ? `Account type: ${accountType || 'hsa'}. User: ${JSON.stringify(userContext || {})}`
        : `User context: ${JSON.stringify(userContext || {})}`;
      userContent = [
        ...buildDocumentContent(fileData, mediaType),
        { type: 'text', text: extra },
      ];
    } else if (action === 'check_eligibility') {
      userContent = `Expense: "${body.expense}". Account: ${body.accountType}. User: ${JSON.stringify(body.userContext || {})}`;
    } else if (action === 'build_claim') {
      userContent = `Build claim for ${body.name}, member ${body.memberId}, account ${body.accountType}, employer ${body.employer}, period ${body.period}. Expenses:\n${body.expenses}`;
    } else {
      return jsonResponse({ error: 'Invalid action payload' }, 400);
    }

    const raw = await callAnthropic(SYSTEMS[action], userContent, action === 'analyze_benefits' ? 8192 : 2048);
    const result = parseJsonFromText(raw);
    return jsonResponse(result);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'AI agent error' }, 500);
  }
});
