# Вырезать кусок скриншота и увеличить без сглаживания: видно, как выглядит каждый пиксель.
# powershell -File tools/crop.ps1 -In shots/a.png -Out shots/a-crop.png [-X 600 -Y 620 -W 300 -H 200 -Scale 3]
param([string]$In, [string]$Out, [int]$X = 600, [int]$Y = 620, [int]$W = 300, [int]$H = 200, [int]$Scale = 3)
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile((Resolve-Path $In))
$crop = New-Object System.Drawing.Bitmap ($W * $Scale), ($H * $Scale)
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.InterpolationMode = 'NearestNeighbor'
$g.PixelOffsetMode = 'Half'
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, ($W * $Scale), ($H * $Scale)), (New-Object System.Drawing.Rectangle $X, $Y, $W, $H), 'Pixel')
$crop.Save((Join-Path (Get-Location) $Out))
$g.Dispose(); $src.Dispose(); $crop.Dispose()
