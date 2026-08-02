[CmdletBinding()]
param(
    # Positive values move the star right; negative values move it left.
    [double]$StarOffsetX = 0,

    # Positive values move the star down; negative values move it up.
    [double]$StarOffsetY = 0
)

$ErrorActionPreference = 'Stop'

function Format-SvgNumber([double]$Value) {
    return $Value.ToString('0.###', [System.Globalization.CultureInfo]::InvariantCulture)
}

$frontendRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $frontendRoot 'public/favicon.svg'

# Keep these as named values so the overall wand can be adjusted separately later.
$wandOffsetX = '-1.25'
$starOffsetXText = Format-SvgNumber $StarOffsetX
$starOffsetYText = Format-SvgNumber $StarOffsetY

$svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <title>mgck</title>
  <g transform="translate($wandOffsetX 0)">
    <path d="M5 19 16.7 7.3" fill="none" stroke="#070b13" stroke-linecap="round" stroke-width="6"/>
    <path d="M5 19 16.7 7.3" fill="none" stroke="#8ec5ff" stroke-linecap="round" stroke-width="3.2"/>
    <g transform="translate($starOffsetXText $starOffsetYText)">
      <path d="m17 .75 1.7 3.05 3.4.6-2.5 2.4.5 3.4-3.1-1.55-3.1 1.55.5-3.4-2.5-2.4 3.4-.6Z" fill="#f9d871" stroke="#070b13" stroke-linejoin="round" stroke-width="1.5"/>
    </g>
  </g>
</svg>
"@

[System.IO.File]::WriteAllText(
    $outputPath,
    $svg,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Generated $outputPath (star offset: X=$starOffsetXText, Y=$starOffsetYText)."
