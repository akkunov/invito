# Eventiq: append and publish Editorial Ivory II without changing old immutable releases.
# Run from the repository root after starting NestJS. Keep JWT out of Git and chat.
param(
  [string]$ApiBase = "http://localhost:4000/api/v1",
  [string]$WorkspaceId = "e440c062-534e-4d0d-911a-53afa03a6369",
  [string]$TemplateId = "a61fe34a-3684-4669-bcab-106bb8d886f0"
)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$path = Join-Path $root "templates/packages/editorial-ivory.v2.json"
if (-not (Test-Path $path)) { throw "Missing Editorial Ivory II package: $path" }
$token = Read-Host "Supabase access token (ADMIN/OWNER)"
if ([string]::IsNullOrWhiteSpace($token)) { throw "An access token is required" }
$headers = @{ Authorization = "Bearer $token" }
try {
  $template = Invoke-RestMethod -Method Get -Uri "$ApiBase/templates/$TemplateId" -Headers $headers
  if ($template.workspaceId -ne $WorkspaceId -or $template.slug -ne "editorial-ivory") {
    throw "Unexpected template. Refusing to modify another workspace or slug."
  }
  $pack = Get-Content -Raw -Encoding UTF8 $path | ConvertFrom-Json
  if ($pack.format -ne "eventiq-template" -or $pack.version -ne 1 -or $pack.manifest.slug -ne $template.slug) {
    throw "Invalid Editorial Ivory package envelope"
  }
  if ($template.latestVersion -eq 1) {
    $body = @{
      expectedVersion = 1
      note = "Editorial Ivory II: paper textures, framing and improved editorial section composition"
      document = $pack.document
      personalization = $pack.personalization
    } | ConvertTo-Json -Depth 100 -Compress
    $version = Invoke-RestMethod -Method Post -Uri "$ApiBase/templates/$TemplateId/versions" `
      -Headers $headers -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
    Write-Host "Created immutable template version: $($version.number)"
  }
  elseif ($template.latestVersion -eq 2) {
    Write-Host "Version 2 already exists. Skipping append."
  }
  else {
    throw "Template latestVersion is $($template.latestVersion); inspect versions manually before publishing."
  }

  $published = Invoke-RestMethod -Method Post `
    -Uri "$ApiBase/workspaces/$WorkspaceId/templates/$TemplateId/publish" `
    -Headers $headers -ContentType "application/json" -Body '{"publicSlug":"editorial-ivory"}'
  $published | Format-List
  Write-Host "Published: http://localhost:3000/ru/catalog/editorial-ivory"
  Write-Host "Previously created drafts remain pinned to their immutable version."
}
finally {
  Remove-Variable token,headers -ErrorAction SilentlyContinue
}
