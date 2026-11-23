# Upgrade the existing Editorial Ivory template to the Mobile Editor 3 package.
# Executes against local NestJS. Does not reset a database or mutate old immutable versions.
param(
  [string]$ApiBase="http://localhost:4000/api/v1",
  [string]$WorkspaceId="e440c062-534e-4d0d-911a-53afa03a6369",
  [string]$TemplateId="a61fe34a-3684-4669-bcab-106bb8d886f0"
)
$ErrorActionPreference="Stop"
$packagePath=Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")).Path "templates/packages/editorial-ivory.v3.json"
if (-not (Test-Path $packagePath)) { throw "Template package not found: $packagePath" }
$token=Read-Host "Supabase JWT for your Eventiq ADMIN/OWNER account"
if ([string]::IsNullOrWhiteSpace($token)){throw "JWT required"}
$headers=@{Authorization="Bearer $token"}
try {
  $template=Invoke-RestMethod -Method Get -Uri "$ApiBase/templates/$TemplateId" -Headers $headers
  if($template.workspaceId -ne $WorkspaceId -or $template.slug -ne "editorial-ivory"){
    throw "Unexpected workspace or template. No changes made."
  }
  $pack=Get-Content -Path $packagePath -Raw -Encoding UTF8 | ConvertFrom-Json
  if($pack.format -ne "eventiq-template" -or $pack.version -ne 1 -or
    $pack.manifest.slug -ne "editorial-ivory" -or
    $pack.personalization.sectionEditing.hideablePageIds.Count -lt 1){
    throw "Invalid template package. No changes made."
  }
  $current=[int]$template.latestVersion
  if($current -le 2){
    $body=@{
      expectedVersion=$current
      note="Mobile Editor 3.0 — explicit page visibility and ordering permissions"
      document=$pack.document
      personalization=$pack.personalization
    } | ConvertTo-Json -Depth 100 -Compress
    $version=Invoke-RestMethod -Method Post -Uri "$ApiBase/templates/$TemplateId/versions" `
      -Headers $headers -ContentType "application/json; charset=utf-8" `
      -Body ([Text.Encoding]::UTF8.GetBytes($body))
    Write-Host "Created immutable version $($version.number)"
  }
  elseif($current -eq 3){
    $previous=Invoke-RestMethod -Method Get -Uri "$ApiBase/templates/$TemplateId/versions/3" -Headers $headers
    if($previous.note -notlike "Mobile Editor 3.0*"){
      throw "Version 3 already contains a different design. Inspect it before proceeding."
    }
    Write-Host "Mobile Editor 3.0 version already exists; skipping append."
  }
  else {
    throw "Template already at version $current. Inspect before appending."
  }
  $published=Invoke-RestMethod -Method Post `
    -Uri "$ApiBase/workspaces/$WorkspaceId/templates/$TemplateId/publish" `
    -Headers $headers -ContentType "application/json" `
    -Body '{"publicSlug":"editorial-ivory"}'
  $published | Format-List
  Write-Host "Open http://localhost:3000/ru/editor?template=editorial-ivory"
  Write-Host "Existing customer drafts stay pinned to their original templateVersionId."
}
finally {
  Remove-Variable token,headers -ErrorAction SilentlyContinue
}
