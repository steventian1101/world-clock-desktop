Add-Type -AssemblyName System.Drawing

function New-ClockBitmap {
    param([int]$Size)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $cx = $Size / 2.0
    $cy = $Size / 2.0
    $pad = [Math]::Max(1, [int]($Size * 0.06))
    $radius = ($Size / 2.0) - $pad

    $faceRect = New-Object System.Drawing.RectangleF(($cx - $radius), ($cy - $radius), ($radius * 2), ($radius * 2))
    $faceBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
    $g.FillEllipse($faceBrush, $faceRect)
    $faceBrush.Dispose()

    $innerR = $radius * 0.86
    $innerRect = New-Object System.Drawing.RectangleF(($cx - $innerR), ($cy - $innerR), ($innerR * 2), ($innerR * 2))
    $innerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 247, 250))
    $g.FillEllipse($innerBrush, $innerRect)
    $innerBrush.Dispose()

    $borderWidth = [Math]::Max(1, $Size * 0.03)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 26, 31, 44), [float]$borderWidth)
    $g.DrawEllipse($borderPen, $faceRect)
    $borderPen.Dispose()

    $tickColor = [System.Drawing.Color]::FromArgb(255, 26, 31, 44)
    $tickPen = New-Object System.Drawing.Pen($tickColor, [float]([Math]::Max(1, $Size * 0.04)))
    for ($i = 0; $i -lt 12; $i++) {
        $angle = ($i * 30 - 90) * [Math]::PI / 180.0
        $outerX = $cx + ([Math]::Cos($angle) * $innerR)
        $outerY = $cy + ([Math]::Sin($angle) * $innerR)
        $tickLen = if ($i % 3 -eq 0) { $innerR * 0.20 } else { $innerR * 0.10 }
        $innerX = $cx + ([Math]::Cos($angle) * ($innerR - $tickLen))
        $innerY = $cy + ([Math]::Sin($angle) * ($innerR - $tickLen))
        if ($Size -ge 32 -or ($i % 3 -eq 0)) {
            $g.DrawLine($tickPen, [float]$innerX, [float]$innerY, [float]$outerX, [float]$outerY)
        }
    }
    $tickPen.Dispose()

    $hourHandPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 26, 31, 44), [float]([Math]::Max(1.5, $Size * 0.08)))
    $hourHandPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $hourHandPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $hourAngle = (300 - 90) * [Math]::PI / 180.0
    $hourLen = $innerR * 0.5
    $hx = $cx + ([Math]::Cos($hourAngle) * $hourLen)
    $hy = $cy + ([Math]::Sin($hourAngle) * $hourLen)
    $g.DrawLine($hourHandPen, [float]$cx, [float]$cy, [float]$hx, [float]$hy)
    $hourHandPen.Dispose()

    $minHandPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 26, 31, 44), [float]([Math]::Max(1, $Size * 0.055)))
    $minHandPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $minHandPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $minAngle = (60 - 90) * [Math]::PI / 180.0
    $minLen = $innerR * 0.72
    $mx = $cx + ([Math]::Cos($minAngle) * $minLen)
    $my = $cy + ([Math]::Sin($minAngle) * $minLen)
    $g.DrawLine($minHandPen, [float]$cx, [float]$cy, [float]$mx, [float]$my)
    $minHandPen.Dispose()

    $pinR = [Math]::Max(1.0, $Size * 0.06)
    $pinRect = New-Object System.Drawing.RectangleF(($cx - $pinR), ($cy - $pinR), ($pinR * 2), ($pinR * 2))
    $pinBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
    $g.FillEllipse($pinBrush, $pinRect)
    $pinBrush.Dispose()

    $g.Dispose()
    return $bmp
}

function Save-Png {
    param([System.Drawing.Bitmap]$Bmp, [string]$Path)
    $Bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-Ico {
    param([int[]]$Sizes, [string]$Path)

    $images = @()
    foreach ($s in $Sizes) {
        $bmp = New-ClockBitmap -Size $s
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $bytes = $ms.ToArray()
        $ms.Dispose()
        $bmp.Dispose()
        $images += [pscustomobject]@{ Size = $s; Bytes = $bytes }
    }

    $out = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter($out)

    # ICONDIR
    $bw.Write([uint16]0)            # reserved
    $bw.Write([uint16]1)            # type = ICO
    $bw.Write([uint16]$images.Count)

    # ICONDIRENTRY*N
    $headerSize = 6 + 16 * $images.Count
    $dataOffset = $headerSize
    foreach ($img in $images) {
        $w = if ($img.Size -ge 256) { 0 } else { [byte]$img.Size }
        $bw.Write([byte]$w)         # width
        $bw.Write([byte]$w)         # height
        $bw.Write([byte]0)          # color count
        $bw.Write([byte]0)          # reserved
        $bw.Write([uint16]1)        # planes
        $bw.Write([uint16]32)       # bit count
        $bw.Write([uint32]$img.Bytes.Length)
        $bw.Write([uint32]$dataOffset)
        $dataOffset += $img.Bytes.Length
    }

    foreach ($img in $images) {
        $bw.Write($img.Bytes)
    }

    $bw.Flush()
    [System.IO.File]::WriteAllBytes($Path, $out.ToArray())
    $bw.Dispose()
    $out.Dispose()
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Definition

# PNG variants Tauri references in tauri.conf.json
$pngTargets = @{ 32 = "32x32.png"; 128 = "128x128.png"; 256 = "128x128@2x.png" }
foreach ($k in $pngTargets.Keys) {
    $bmp = New-ClockBitmap -Size $k
    Save-Png -Bmp $bmp -Path (Join-Path $here $pngTargets[$k])
    $bmp.Dispose()
}

# Also a default icon.png (1024 source-ish, but 256 is enough)
$bmp256 = New-ClockBitmap -Size 256
Save-Png -Bmp $bmp256 -Path (Join-Path $here "icon.png")
$bmp256.Dispose()

# Multi-resolution ICO for the Windows .exe
New-Ico -Sizes @(16, 32, 48, 64, 128, 256) -Path (Join-Path $here "icon.ico")

Write-Output "Tauri icons generated."
