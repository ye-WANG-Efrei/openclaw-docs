// 把 openclaw.aiedi.cn/doc/* 的请求转发给 Cloudflare Pages
// 其他所有路径完全不受影响

const PAGES_HOST = "https://openclaw-docs-17d.pages.dev";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 只处理 /doc 开头的路径
    if (!url.pathname.startsWith("/doc")) {
      return fetch(request);
    }

    // 去掉 /doc 前缀，转发给 Pages 站点
    const newPath = url.pathname.slice("/doc".length) || "/";
    const targetUrl = `${PAGES_HOST}${newPath}${url.search}`;

    const response = await fetch(new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
    }));

    return response;
  },
};
