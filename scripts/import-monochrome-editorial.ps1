# Import/publish the new template. Does not overwrite existing designs or drafts.
param(
  [string]$ApiBase="http://localhost:4000/api/v1",
  [string]$WorkspaceId="e440c062-534e-4d0d-911a-53afa03a6369"
)
$ErrorActionPreference="Stop"
$root=(Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$file=Join-Path $root "templates/packages/monochrome-editorial.v1.json"
$pack=Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json
foreach($entry in $pack.document.assets.PSObject.Properties){
  $asset=$entry.Value
  $path=Join-Path $root ("public"+$asset.storageKey)
  if(!(Test-Path -LiteralPath $path -PathType Leaf)){throw "Missing image: $path. Extract eventiq-monochrome-assets.zip into the repository root."}
  if((Get-Item -LiteralPath $path).Length -ne $asset.sizeBytes){throw "Image size mismatch: $path"}
}
$secret=Read-Host "Supabase access token (ADMIN/OWNER)" -AsSecureString
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
  $token=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
$headers=@{Authorization="Bearer $token"}
try {
  $slug=$pack.manifest.slug
  $existing=$null
  $page=1
  do {
    $list=Invoke-RestMethod -Uri "$ApiBase/workspaces/$WorkspaceId/templates?page=$page&limit=50" -Headers $headers
    $existing=$list.items | Where-Object {$_.slug -eq $slug} | Select-Object -First 1
    $page=$list.nextPage
  } while($page -and !$existing)
  if($existing){
    throw "Template already exists: $($existing.id). Inspect the existing version rather than overwrite it."
  }
  # Optionally authorize configured music tracks in the new version.
  $music=Invoke-RestMethod -Uri "$ApiBase/catalog/music"
  $field=$pack.personalization.fields | Where-Object {$_.kind -eq "music"} | Select-Object -First 1
  if($field){$field.sources=@($music.tracks | ForEach-Object {$_.source} | Where-Object {$_} | Select-Object -Unique -First 50)}
  $body=$pack | ConvertTo-Json -Depth 100 -Compress
  $template=Invoke-RestMethod -Method Post -Uri "$ApiBase/workspaces/$WorkspaceId/template-packages/import" `
    -Headers $headers -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
  Write-Host "Imported template ID: $($template.id)"
  $publish=@{publicSlug=$slug} | ConvertTo-Json -Compress
  Invoke-RestMethod -Method Post -Uri "$ApiBase/workspaces/$WorkspaceId/templates/$($template.id)/publish" `
    -Headers $headers -ContentType "application/json" -Body $publish
  Write-Host "Catalog: http://localhost:3000/ru/catalog/$slug"
  Write-Host "Editor:  http://localhost:3000/ru/editor?template=$slug"
} finally {
  Remove-Variable token,headers,secret -ErrorAction SilentlyContinue
}
