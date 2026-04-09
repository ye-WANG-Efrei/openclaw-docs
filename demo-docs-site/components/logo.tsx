/**
 * CroissantLogo — uses the PNG logo image.
 * Plain <img> with /doc/logo.png works for both:
 *   - openclaw.aiedi.cn/doc/ (Worker strips /doc → pages.dev/logo.png ✓)
 *   - clean-main.pages.dev/doc/logo.png (file exists in public/doc/ ✓)
 */
export function CroissantLogo({
  size = 36,
}: {
  size?: number;
  variant?: "light" | "dark";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/doc/logo.png"
      alt="OpenClaw logo"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0, objectFit: "contain" }}
    />
  );
}
