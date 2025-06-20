import { createProxyMiddleware } from 'http-proxy-middleware';
import { SERVICES } from '../config/services';

export const socketProxy =createProxyMiddleware({
  target: SERVICES.DEBATE,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/socket': '' },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    console.log("🔁 WebSocket Upgrade Request:", req.url);
  },
  pathFilter: '/socket'
} as any);
