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

export async function callOpenAI(
  system: string,
  userContent: unknown,
  maxTokens = 4096,
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
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

function fileBlock(filename: string, mediaType: string, fileData: string) {
  return {
    type: 'file',
    file: {
      filename,
      file_data: `data:${mediaType};base64,${fileData}`,
    },
  };
}

export function buildDocumentContent(fileData: string, mediaType: string) {
  if (mediaType === 'application/pdf') {
    return [
      fileBlock('benefits.pdf', mediaType, fileData),
      { type: 'text', text: 'Analyze this employee benefits document.' },
    ];
  }

  if (mediaType.includes('wordprocessing') || mediaType === 'application/msword') {
    const ext = mediaType.includes('openxml') ? 'benefits.docx' : 'benefits.doc';
    return [
      fileBlock(ext, mediaType, fileData),
      { type: 'text', text: 'Analyze this employee benefits document.' },
    ];
  }

  return [
    {
      type: 'image_url',
      image_url: { url: `data:${mediaType};base64,${fileData}` },
    },
    { type: 'text', text: 'Analyze this employee benefits document or receipt.' },
  ];
}
