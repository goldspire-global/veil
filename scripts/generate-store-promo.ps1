param(
  [Parameter(Mandatory = $true)][string]$IconPath,
  [Parameter(Mandatory = $true)][string]$OutPath,
  [Parameter(Mandatory = $true)][int]$Width,
  [Parameter(Mandatory = $true)][int]$Height
)

Add-Type -AssemblyName System.Drawing

$bg = [System.Drawing.Color]::FromArgb(255, 13, 17, 27)
$gold = [System.Drawing.Color]::FromArgb(255, 212, 160, 23)
$muted = [System.Drawing.Color]::FromArgb(255, 168, 176, 194)
$white = [System.Drawing.Color]::FromArgb(255, 230, 236, 245)

$bmp = New-Object System.Drawing.Bitmap $Width, $Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'ClearTypeGridFit'
$g.Clear($bg)

$logo = [System.Drawing.Image]::FromFile($IconPath)

if ($Width -le 500) {
  $iconSize = 128
  $iconX = [int](($Width - $iconSize) / 2)
  $iconY = 52
  $g.DrawImage($logo, $iconX, $iconY, $iconSize, $iconSize)

  $titleFont = New-Object System.Drawing.Font('Segoe UI', 28, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Regular)
  $goldBrush = New-Object System.Drawing.SolidBrush($gold)
  $mutedBrush = New-Object System.Drawing.SolidBrush($muted)
  $titleSize = $g.MeasureString('Veil', $titleFont)
  $g.DrawString('Veil', $titleFont, $goldBrush, [int](($Width - $titleSize.Width) / 2), 188)
  $subSize = $g.MeasureString('by Goldspire', $subFont)
  $g.DrawString('by Goldspire', $subFont, $mutedBrush, [int](($Width - $subSize.Width) / 2), 232)
  $titleFont.Dispose(); $subFont.Dispose(); $goldBrush.Dispose(); $mutedBrush.Dispose()
} else {
  $iconSize = 200
  $padX = 120
  $iconY = [int](($Height - $iconSize) / 2)
  $g.DrawImage($logo, $padX, $iconY, $iconSize, $iconSize)

  $textX = $padX + $iconSize + 48
  $titleFont = New-Object System.Drawing.Font('Segoe UI', 56, [System.Drawing.FontStyle]::Bold)
  $brandFont = New-Object System.Drawing.Font('Segoe UI', 22, [System.Drawing.FontStyle]::Regular)
  $tagFont = New-Object System.Drawing.Font('Segoe UI', 26, [System.Drawing.FontStyle]::Regular)
  $goldBrush = New-Object System.Drawing.SolidBrush($gold)
  $mutedBrush = New-Object System.Drawing.SolidBrush($muted)
  $whiteBrush = New-Object System.Drawing.SolidBrush($white)

  $g.DrawString('Veil', $titleFont, $goldBrush, $textX, [int]($Height / 2) - 92)
  $g.DrawString('by Goldspire', $brandFont, $mutedBrush, $textX, [int]($Height / 2) - 18)
  $g.DrawString('Protect sensitive text before you send it', $tagFont, $whiteBrush, $textX, [int]($Height / 2) + 28)

  $titleFont.Dispose(); $brandFont.Dispose(); $tagFont.Dispose()
  $goldBrush.Dispose(); $mutedBrush.Dispose(); $whiteBrush.Dispose()
}

$logo.Dispose()
$g.Dispose()
$bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
