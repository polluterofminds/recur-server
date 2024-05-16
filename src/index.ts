/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import handleProxy from './proxy';
import handleRedirect from './redirect';
import apiRouter from './router';

function handleOptions(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Adjust the origin as needed
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS', // Adjust the methods as needed
    'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || '', 
    'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
  };
  return new Response(null, { status: 204, headers });
}

// Export a default object containing event handlers
export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
		const url = new URL(request.url);
		if (request.method === 'OPTIONS') {
			return handleOptions(request);
		}
		// You can get pretty far with simple logic like if/switch-statements
		switch (url.pathname) {
			case '/redirect':
				return handleRedirect.fetch(request, env, ctx);

			case '/proxy':
				return handleProxy.fetch(request, env, ctx);
		}

		if (url.pathname.startsWith('/api/')) {
			console.log("Go to the router")
			// You can also use more robust routing
			return apiRouter.handle(request)
		}

		return new Response(
			`Try making requests to:
      <ul>
      <li><code><a href="/redirect?redirectUrl=https://example.com/">/redirect?redirectUrl=https://example.com/</a></code>,</li>
      <li><code><a href="/proxy?modify&proxyUrl=https://example.com/">/proxy?modify&proxyUrl=https://example.com/</a></code>, or</li>
      <li><code><a href="/api/todos">/api/todos</a></code></li>`,
			{ headers: { 'Content-Type': 'text/html' } }
		);
	},
};
