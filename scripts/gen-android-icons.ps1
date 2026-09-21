# scripts/gen-android-icons.ps1 — generate mipmap launcher + splash PNG dari assets/icon.png
# Jalan: powershell -ExecutionPolicy Bypass -File scripts/gen-android-icons.ps1
# Tanpa dependensi native (murni .NET System.Drawing).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$srcPath = Join-Path $root 'assets\icon.png'
$resDir = Join-Path $root 'android\app\src\main\res'
$src = [System.Drawing.Image]::FromFile($srcPath)

function Save-Resized($image, $w, $h, $dest, [switch]$Round) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $bmp.SetResolution(96, 96)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  if ($Round) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $w, $h)
    $g.SetClip($path)
  }
  $g.DrawImage($image, 0, 0, $w, $h)
  $g.Dispose()
  $dir = Split-Path $dest -Parent
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

function Save-RoundedClip($g, $x, $y, $s) {
  # Samakan radius sudut SVG sumber (rx=112 dari 512 = 21.9%) agar sudut putih screenshot terpotong
  $r = $s * 112 / 512
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($x, $y, 2 * $r, 2 * $r, 180, 90)
  $path.AddArc($x + $s - 2 * $r, $y, 2 * $r, 2 * $r, 270, 90)
  $path.AddArc($x + $s - 2 * $r, $y + $s - 2 * $r, 2 * $r, 2 * $r, 0, 90)
  $path.AddArc($x, $y + $s - 2 * $r, 2 * $r, 2 * $r, 90, 90)
  $path.CloseFigure()
  $g.SetClip($path)
  $path.Dispose()
}
$dpi = @{ 'mipmap-mdpi' = 48; 'mipmap-hdpi' = 72; 'mipmap-xhdpi' = 96; 'mipmap-xxhdpi' = 144; 'mipmap-xxxhdpi' = 192 }
foreach ($k in $dpi.Keys) {
  Save-Resized $src $dpi[$k] $dpi[$k] (Join-Path $resDir "$k\ic_launcher.png")
  Save-Resized $src $dpi[$k] $dpi[$k] (Join-Path $resDir "$k\ic_launcher_round.png") -Round
}

# 2. Adaptive foreground (mdpi..xxxhdpi): full-bleed di atas bg adaptif + clip sudut
# agar sudut putih screenshot menyatu dengan background (#7c2d12)
$fgBg = [System.Drawing.Color]::FromArgb(0x7c, 0x2d, 0x12)
$fg = @{ 'mipmap-mdpi' = 108; 'mipmap-hdpi' = 162; 'mipmap-xhdpi' = 216; 'mipmap-xxhdpi' = 324; 'mipmap-xxxhdpi' = 432 }
foreach ($k in $fg.Keys) {
  $s = $fg[$k]
  $bmp = New-Object System.Drawing.Bitmap($s, $s)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.Clear($fgBg)
  Save-RoundedClip $g 0 0 $s
  $g.DrawImage($src, 0, 0, $s, $s)
  $g.Dispose()
  $bmp.Save((Join-Path $resDir "$k\ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

# 3. Background adaptif: samakan rona gelap ikon agar tepi parallax menyatu
$bgPath = Join-Path $resDir 'values\ic_launcher_background.xml'
$bg = Get-Content -LiteralPath $bgPath -Raw
$bg = $bg -replace '#FFFFFF', '#7c2d12'
Set-Content -LiteralPath $bgPath -Value $bg -NoNewline -Encoding utf8

# 4. Splash: ganti logo Capacitor dengan ikon Kokoro di atas krem (#ede5d4)
$cream = [System.Drawing.Color]::FromArgb(0xED, 0xE5, 0xD4)
$splashFiles = Get-ChildItem -LiteralPath $resDir -Recurse -Filter 'splash.png'
foreach ($f in $splashFiles) {
  $old = [System.Drawing.Image]::FromFile($f.FullName)
  $w = $old.Width; $h = $old.Height
  $old.Dispose()
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear($cream)
  $s = [Math]::Min($w, $h) * 0.42
  $x = ($w - $s) / 2; $y = ($h - $s) / 2
  Save-RoundedClip $g $x $y $s
  $g.DrawImage($src, $x, $y, $s, $s)
  $g.Dispose()
  $bmp.Save($f.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$src.Dispose()
Write-Output 'Android icons + splash OK'
