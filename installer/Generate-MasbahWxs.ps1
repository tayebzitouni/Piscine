$ErrorActionPreference = 'Stop'
$root = Resolve-Path .
$appDir = Resolve-Path 'release-dotnet/Masbah'
$outFile = Join-Path $root 'installer/Masbah.wxs'
$upgradeCode = '8f6d4bf9-87be-4938-a884-b690dcf8eb2e'

function XmlEscape([string]$value) {
  return [System.Security.SecurityElement]::Escape($value)
}

function SafeId([string]$prefix, [string]$value) {
  $id = ($value -replace '[^A-Za-z0-9_]', '_')
  if ($id.Length -gt 60) { $id = $id.Substring(0, 60) }
  return "$prefix$id"
}

function Get-RelativePath([string]$basePath, [string]$targetPath) {
  $baseFullPath = (Resolve-Path $basePath).Path
  $targetFullPath = (Resolve-Path $targetPath).Path
  $baseFullPath = $baseFullPath.TrimEnd('\')
  if ($targetFullPath -eq $baseFullPath) { return '' }
  $prefix = $baseFullPath + '\'
  if (-not $targetFullPath.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Path '$targetFullPath' is not under '$baseFullPath'."
  }
  return $targetFullPath.Substring($prefix.Length)
}

$directories = [ordered]@{}
$directories[''] = 'INSTALLFOLDER'
$files = Get-ChildItem -LiteralPath $appDir -Recurse -File | Sort-Object FullName
foreach ($file in $files) {
  $relativeDir = Get-RelativePath $appDir $file.DirectoryName
  if ($relativeDir -eq '.') { $relativeDir = '' }
  if ($relativeDir -ne '') {
    $parts = $relativeDir -split [regex]::Escape([System.IO.Path]::DirectorySeparatorChar)
    for ($i = 0; $i -lt $parts.Count; $i++) {
      $ancestor = ($parts[0..$i] -join [System.IO.Path]::DirectorySeparatorChar)
      if (-not $directories.Contains($ancestor)) {
        $directories[$ancestor] = SafeId 'DIR_' $ancestor
      }
    }
  }
}

$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine('<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs">')
[void]$sb.AppendLine('  <Package Name="Masbah" Manufacturer="Tayeb Zitouni" Version="1.0.0.0" UpgradeCode="' + $upgradeCode + '" Scope="perMachine">')
[void]$sb.AppendLine('    <MajorUpgrade DowngradeErrorMessage="A newer version of Masbah is already installed." />')
[void]$sb.AppendLine('    <MediaTemplate EmbedCab="yes" />')
[void]$sb.AppendLine('    <StandardDirectory Id="ProgramFiles64Folder">')
[void]$sb.AppendLine('      <Directory Id="INSTALLFOLDER" Name="Masbah">')

foreach ($entry in $directories.GetEnumerator()) {
  if ($entry.Key -eq '') { continue }
  $parts = $entry.Key -split [regex]::Escape([System.IO.Path]::DirectorySeparatorChar)
  if ($parts.Count -eq 1) {
    [void]$sb.AppendLine('        <Directory Id="' + $entry.Value + '" Name="' + (XmlEscape $parts[0]) + '" />')
  }
}
[void]$sb.AppendLine('      </Directory>')
[void]$sb.AppendLine('    </StandardDirectory>')
[void]$sb.AppendLine('    <StandardDirectory Id="ProgramMenuFolder">')
[void]$sb.AppendLine('      <Directory Id="ApplicationProgramsFolder" Name="Masbah" />')
[void]$sb.AppendLine('    </StandardDirectory>')
[void]$sb.AppendLine('    <StandardDirectory Id="DesktopFolder" />')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('    <Feature Id="MainFeature" Title="Masbah" Level="1">')
[void]$sb.AppendLine('      <ComponentGroupRef Id="AppFiles" />')
[void]$sb.AppendLine('      <ComponentRef Id="StartMenuShortcutComponent" />')
[void]$sb.AppendLine('      <ComponentRef Id="DesktopShortcutComponent" />')
[void]$sb.AppendLine('    </Feature>')
[void]$sb.AppendLine('  </Package>')
[void]$sb.AppendLine('')

# Nested directories beyond one level are declared in fragments with DirectoryRef to parent.
foreach ($entry in $directories.GetEnumerator()) {
  if ($entry.Key -eq '') { continue }
  $parts = $entry.Key -split [regex]::Escape([System.IO.Path]::DirectorySeparatorChar)
  if ($parts.Count -le 1) { continue }
  $parentPath = ($parts[0..($parts.Count - 2)] -join [System.IO.Path]::DirectorySeparatorChar)
  $name = $parts[-1]
  [void]$sb.AppendLine('  <Fragment>')
  [void]$sb.AppendLine('    <DirectoryRef Id="' + $directories[$parentPath] + '">')
  [void]$sb.AppendLine('      <Directory Id="' + $entry.Value + '" Name="' + (XmlEscape $name) + '" />')
  [void]$sb.AppendLine('    </DirectoryRef>')
  [void]$sb.AppendLine('  </Fragment>')
}

[void]$sb.AppendLine('  <Fragment>')
[void]$sb.AppendLine('    <ComponentGroup Id="AppFiles">')
$index = 0
foreach ($file in $files) {
  $index++
  $relativePath = Get-RelativePath $appDir $file.FullName
  $relativeDir = [System.IO.Path]::GetDirectoryName($relativePath)
  if ($relativeDir -eq $null) { $relativeDir = '' }
  $componentId = 'CMP_' + $index.ToString('0000')
  $fileId = 'FIL_' + $index.ToString('0000')
  $directoryId = $directories[$relativeDir]
  $source = '$(var.AppSourceDir)\' + ($relativePath -replace '/', '\')
  [void]$sb.AppendLine('      <Component Id="' + $componentId + '" Directory="' + $directoryId + '" Guid="*">')
  [void]$sb.AppendLine('        <File Id="' + $fileId + '" Source="' + (XmlEscape $source) + '" KeyPath="yes" />')
  [void]$sb.AppendLine('      </Component>')
  [void]$sb.AppendLine('      <ComponentRef Id="' + $componentId + '" />')
}
[void]$sb.AppendLine('    </ComponentGroup>')
[void]$sb.AppendLine('  </Fragment>')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('  <Fragment>')
[void]$sb.AppendLine('    <Component Id="StartMenuShortcutComponent" Directory="ApplicationProgramsFolder" Guid="*">')
[void]$sb.AppendLine('      <Shortcut Id="StartMenuShortcut" Name="Masbah" Description="Masbah desktop application" Target="[INSTALLFOLDER]Masbah.exe" WorkingDirectory="INSTALLFOLDER" />')
[void]$sb.AppendLine('      <RemoveFolder Id="RemoveApplicationProgramsFolder" Directory="ApplicationProgramsFolder" On="uninstall" />')
[void]$sb.AppendLine('      <RegistryValue Root="HKCU" Key="Software\Masbah" Name="StartMenuShortcut" Type="integer" Value="1" KeyPath="yes" />')
[void]$sb.AppendLine('    </Component>')
[void]$sb.AppendLine('    <Component Id="DesktopShortcutComponent" Directory="DesktopFolder" Guid="*">')
[void]$sb.AppendLine('      <Shortcut Id="DesktopShortcut" Name="Masbah" Description="Masbah desktop application" Target="[INSTALLFOLDER]Masbah.exe" WorkingDirectory="INSTALLFOLDER" />')
[void]$sb.AppendLine('      <RegistryValue Root="HKCU" Key="Software\Masbah" Name="DesktopShortcut" Type="integer" Value="1" KeyPath="yes" />')
[void]$sb.AppendLine('    </Component>')
[void]$sb.AppendLine('  </Fragment>')
[void]$sb.AppendLine('</Wix>')

Set-Content -LiteralPath $outFile -Value $sb.ToString() -Encoding UTF8
Write-Host $outFile
