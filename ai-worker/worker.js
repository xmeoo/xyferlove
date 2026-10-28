const API_URL = 'https://api.dawvq.com/v1/chat/completions';
const MODEL = 'mimo-v2.5';
const ALLOWED_ORIGINS = new Set([
  'https://xmeoo.github.io',
  'https://cdn.jsdelivr.net'
]);

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (!ALLOWED_ORIGINS.has(origin)) return new Response('Forbidden', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405, origin);
    if (!env.DAWVQ_API_KEY) return reply({ error: 'AI service is not configured' }, 503, origin);

    const length = Number(request.headers.get('Content-Length') || 0);
    if (length > 120000) return reply({ error: 'Conversation is too large' }, 413, origin);

    let input;
    try { input = await request.json(); } catch { return reply({ error: 'Invalid JSON' }, 400, origin); }
    if (!Array.isArray(input.messages) || !input.messages.length || input.messages.length > 40) {
      return reply({ error: 'Send between 1 and 40 messages' }, 400, origin);
    }
    const messages = input.messages.map(message => ({
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      content: typeof message?.content === 'string' ? message.content.slice(0, 12000) : ''
    })).filter(message => message.content.trim());
    if (!messages.length) return reply({ error: 'Message is empty' }, 400, origin);

    try {
      const upstream = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.DAWVQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages, temperature: 0.7 })
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return reply({ error: data?.error?.message || 'AI provider request failed' }, upstream.status, origin);
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') return reply({ error: 'AI provider returned an invalid response' }, 502, origin);
      return reply({ message: content, model: MODEL }, 200, origin);
    } catch {
      return reply({ error: 'Unable to reach the AI provider' }, 502, origin);
    }
  }
};
