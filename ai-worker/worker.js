const API_URL = 'https://api.dawvq.com/v1/chat/completions';
const MODEL = 'mimo-v2.5';
const ALLOWED_ORIGINS = new Set([
  'https://xmeoo.github.io',
  'https://cdn.jsdelivr.net'
]);

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

async function proxyGameAsset(request) {
  const requestUrl = new URL(request.url);
  const upstreamPath = requestUrl.pathname.slice('/gn'.length);
  if (!upstreamPath.startsWith('/s/')) return new Response('Not found', { status: 404 });

  const upstream = new URL(upstreamPath + requestUrl.search, 'https://gn-math.dev');
  const headers = new Headers();
  for (const name of ['Range', 'If-None-Match', 'If-Modified-Since']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers,
      redirect: 'follow',
      cf: request.headers.has('Range') ? undefined : { cacheEverything: true, cacheTtl: 86400 }
    });
    const outputHeaders = new Headers(response.headers);
    outputHeaders.set('Access-Control-Allow-Origin', '*');
    outputHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
    outputHeaders.set('Cache-Control', response.ok ? 'public, max-age=86400' : 'no-store');
    outputHeaders.delete('Set-Cookie');
    outputHeaders.delete('Content-Security-Policy');
    outputHeaders.delete('X-Frame-Options');
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outputHeaders
    });
  } catch {
    return new Response('Unable to download this game file. Please retry.', {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
    });
  }
}

function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/gn/')) {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Allow-Headers': 'Range', 'Access-Control-Max-Age': '86400' } });
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
      return proxyGameAsset(request);
    }
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
