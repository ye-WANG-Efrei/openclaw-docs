Set-Location D:/Openclaw-web/demo-docs-site
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}

npx wrangler pages deploy out/ --project-name openclaw-docs --commit-dirty=true --branch=main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deploy failed." -ForegroundColor Red
    exit 1
}

Write-Host "Deploy success: https://openclaw.aiedi.cn/doc" -ForegroundColor Green
