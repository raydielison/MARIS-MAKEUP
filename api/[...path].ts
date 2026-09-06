import app from './index.ts';

export default function handler(req: any, res: any) {
  // Vercel catch-all functions receive the public /api/... path.
  // Express routes in index.ts are defined without the /api prefix.
  if (typeof req.url === 'string') {
    const queryIndex = req.url.indexOf('?');
    const pathname = queryIndex >= 0 ? req.url.slice(0, queryIndex) : req.url;
    const query = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
    const normalized = pathname.replace(/^\/api(?=\/|$)/, '') || '/';
    req.url = normalized + query;
  }

  return app(req, res);
}
