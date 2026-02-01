export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // POST /play — increment count, return new total
    if (request.method === 'POST' && url.pathname === '/play') {
      const body = await request.json();
      const { key } = body;

      if (!key) {
        return new Response(JSON.stringify({ error: 'missing key' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const current = await env.PLAYS.get(key);
      const count = (current ? parseInt(current, 10) : 0) + 1;
      await env.PLAYS.put(key, String(count));

      return new Response(JSON.stringify({ key, count }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // GET /count?key=... — read current count
    if (request.method === 'GET' && url.pathname === '/count') {
      const key = url.searchParams.get('key');

      if (!key) {
        return new Response(JSON.stringify({ error: 'missing key' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const current = await env.PLAYS.get(key);
      const count = current ? parseInt(current, 10) : 0;

      return new Response(JSON.stringify({ key, count }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};
