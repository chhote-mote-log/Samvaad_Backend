import { createProxyMiddleware } from 'http-proxy-middleware';

export const proxyTo = (target: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^/api`]: '' },
    onError(err, req, res) {
      console.error("Proxy Error:", err);
      res.statusCode = 500;
      res.end("Proxy error");
    }
  } as any); 
