# Update the approved music list without overwriting an existing template version.
# Use -UpgradeEditorialIvory only to explicitly adopt the bundled v4 design.
param(
  [string]$ApiBase="http://localhost:4000/api/v1",
  [string]$WorkspaceId="e440c062-534e-4d0d-911a-53afa03a6369",
  [string]$TemplateId="a61fe34a-3684-4669-bcab-106bb8d886f0",
  [switch]$UpgradeEditorialIvory
)
$ErrorActionPreference="Stop"
$token=Read-Host "Supabase access token (ADMIN/OWNER)"
if([string]::IsNullOrWhiteSpace($token)){throw "Access token required"}
$headers=@{Authorization="Bearer $token"}
try {
  $template=Invoke-RestMethod -Uri "$ApiBase/templates/$TemplateId" -Headers $headers
  if($template.workspaceId -ne $WorkspaceId){throw "Template workspace mismatch"}
  $current=[int]$template.latestVersion
  $version=Invoke-RestMethod -Uri "$ApiBase/templates/$TemplateId/versions/$current" -Headers $headers
  $changed=$false
  if($UpgradeEditorialIvory -and $current -le 3){
    if($template.slug -ne "editorial-ivory"){throw "Wrong template for Editorial Ivory upgrade"}
    $file=Join-Path (Join-Path $PSScriptRoot "..") "templates/packages/editorial-ivory.v4.json"
    $pack=Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json
    $document=$pack.document
    $contract=$pack.personalization
    $changed=$true
  } else {
    $document=$version.document
    $contract=$version.personalization
  }
  $fields=@($contract.fields | Where-Object { $_.kind -eq "music" })
  if($fields.Count -eq 0){throw "This template has no authorized music field. Add one in Studio first."}
  $catalog=Invoke-RestMethod -Uri "$ApiBase/catalog/music"
  $sources=@($catalog.tracks | ForEach-Object { $_.source })
  if($sources.Count -eq 0){Write-Host "Music catalog is empty; no audio files were added."}
  foreach($field in $fields){
    $next=@(@($field.sources)+$sources | Where-Object { $_ } | Select-Object -Unique)
    if($next.Count -gt 50){throw "Each music field permits at most 50 sources. Curate the catalog before syncing."}
    if(($next -join '|') -ne (@($field.sources) -join '|')){$field.sources=$next;$changed=$true}
  }
  if($changed){
    $body=@{expectedVersion=$current;note="Universal editor music library";document=$document;personalization=$contract} | ConvertTo-Json -Depth 100 -Compress
    $new=Invoke-RestMethod -Method Post -Uri "$ApiBase/templates/$TemplateId/versions" `
      -Headers $headers -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
    Write-Host "Created immutable version $($new.number)"
  } else {Write-Host "No additional tracks; using existing version $current"}
  $publicSlug=if($template.publicSlug){$template.publicSlug}else{$template.slug}
  $body=@{publicSlug=$publicSlug} | ConvertTo-Json -Compress
  Invoke-RestMethod -Method Post -Uri "$ApiBase/workspaces/$WorkspaceId/templates/$TemplateId/publish" `
    -Headers $headers -ContentType "application/json; charset=utf-8" -Body $body
} finally {
  Remove-Variable token,headers -ErrorAction SilentlyContinue
}
