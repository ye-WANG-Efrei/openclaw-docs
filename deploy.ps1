# 一键更新部署脚本
# 用法：在 PowerShell 里运行 .\deploy.ps1

Write-Host "▶ 开始构建静态文件..." -ForegroundColor Cyan

Set-Location D:/Openclaw-web/demo-docs-site
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 构建失败，请检查错误信息。" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 构建完成" -ForegroundColor Green
Write-Host "▶ 上传到 Cloudflare Pages..." -ForegroundColor Cyan

npx wrangler pages deploy out/ --project-name openclaw-docs --commit-dirty=true --branch=main

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 部署失败，请检查网络或登录状态。" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ 部署成功！" -ForegroundColor Green
Write-Host "  线上地址：https://openclaw.aiedi.cn/doc" -ForegroundColor Yellow
