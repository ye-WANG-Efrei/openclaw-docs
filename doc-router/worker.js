// 把 openclaw.aiedi.cn/doc/* 的请求转发给 Cloudflare Pages
// aiedi.cn 根目录的域名验证文件直接返回
// 其他所有路径完全不受影响

const PAGES_HOST = "https://openclaw-docs-17d.pages.dev";

const VERIFICATION_FILES = {
  "/7693314d39083a420bd8e8bfca7a2e63.txt": "5c8fe1bbddefb8e4e66aeafc05f66e677f0e935f",
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 域名验证文件
    if (url.pathname in VERIFICATION_FILES) {
      return new Response(VERIFICATION_FILES[url.pathname], {
        headers: { "Content-Type": "text/plain" },
      });
    }

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
