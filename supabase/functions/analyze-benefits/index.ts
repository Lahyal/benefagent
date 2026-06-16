import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  buildDocumentContent,
  callAnthropic,
  handleOptions,
  jsonResponse,
  parseJsonFromText,
} from '../_shared/anthropic.ts';

const ANALYZE_SYSTEM = `You are an expert employee benefits analyst. Analyze the uploaded benefits document and return ONLY valid JSON (no markdown) with this shape:
{
  "employer": "company name or Unknown",
  "summary": "2-3 sentence overview",
  "total_opportunity": number,
  "401k_match": "string description",
  "hsa_available": boolean,
  "fsa_available": boolean,
  "fsa_limit": number,
  "commuter_benefit": boolean,
  "commuter_monthly_limit": number,
  "tuition_reimbursement": number,
  "gym_reimbursement": number,
  "actions": [
    {
      "title": "string",
      "description": "string",
      "estimated_annual_value": number,
      "priority": "high" | "medium" | "low"
    }
  ]
}
Be realistic with dollar estimates based on user context.`;

serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    const { fileData, mediaType, userContext } = await req.json();
    if (!fileData || !mediaType) {
      return jsonResponse({ error: 'fileData and mediaType are required' }, 400);
    }

    const ctx = userContext || {};
    const contextText = `User context: salary=${ctx.salary || 'unknown'}, 401k contribution=${ctx.contrib || 'unknown'}, family=${ctx.family || 'single'}, commute=${ctx.commute || 'unknown'}.`;

    const raw = await callAnthropic(
      ANALYZE_SYSTEM,
      [
        ...buildDocumentContent(fileData, mediaType),
        { type: 'text', text: contextText },
      ],
      8192,
    );

    const result = parseJsonFromText(raw);
    return jsonResponse(result);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Analysis failed' }, 500);
  }
});
