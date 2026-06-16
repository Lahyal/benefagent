const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

export async function callAnthropic(
  system: string,
  userContent: unknown,
  maxTokens = 4096,
): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const blocks = data.content || [];
  return blocks.map((b: { text?: string }) => b.text || '').join('');
}

export function parseJsonFromText(raw: string): unknown {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response as JSON');
  }
}

export function buildDocumentContent(fileData: string, mediaType: string) {
  if (mediaType === 'application/pdf' || mediaType.includes('wordprocessing')) {
    return [
      {
        type: 'document',
        source: { type: 'base64', media_type: mediaType, data: fileData },
      },
      { type: 'text', text: 'Analyze this employee benefits document.' },
    ];
  }
  return [
    {
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: fileData },
    },
    { type: 'text', text: 'Analyze this employee benefits document or receipt.' },
  ];
}
