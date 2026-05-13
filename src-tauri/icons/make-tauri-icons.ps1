Add-Type -AssemblyName System.Drawing

# Source image — the user-provided app icon. All output files are produced by
# high-quality resampling of this single source, so the artwork itself is never
# redrawn or customised.
$SourcePath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) "source.png"

function Resize-IconBitmap {
    param(
        [System.Drawing.Bitmap]$Source,
        [int]$Size
    )
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # If the source is square, fill the canvas; otherwise letter-box on transparency.
    $srcW = $Source.Width
    $srcH = $Source.Height
    if ($srcW -eq $srcH) {
        $g.DrawImage($Source, (New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)),
                              (New-Object System.Drawing.Rectangle(0, 0, $srcW, $srcH)),
                              [System.Drawing.GraphicsUnit]::Pixel)
    } else {
        $scale = [Math]::Min($Size / [double]$srcW, $Size / [double]$srcH)
        $dstW = [int][Math]::Round($srcW * $scale)
        $dstH = [int][Math]::Round($srcH * $scale)
        $dstX = [int][Math]::Round(($Size - $dstW) / 2.0)
        $dstY = [int][Math]::Round(($Size - $dstH) / 2.0)
        $g.DrawImage($Source, (New-Object System.Drawing.Rectangle($dstX, $dstY, $dstW, $dstH)),
                              (New-Object System.Drawing.Rectangle(0, 0, $srcW, $srcH)),
                              [System.Drawing.GraphicsUnit]::Pixel)
    }
    $g.Dispose()
    return $bmp
}

function Save-Png {
    param([System.Drawing.Bitmap]$Bmp, [string]$Path)
    $Bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-Ico {
    param(
        [System.Drawing.Bitmap]$Source,
        [int[]]$Sizes,
        [string]$Path
    )

    $images = @()
    foreach ($s in $Sizes) {
        $bmp = Resize-IconBitmap -Source $Source -Size $s
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
    $bw.Write([uint16]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]$images.Count)

    $headerSize = 6 + 16 * $images.Count
    $dataOffset = $headerSize
    foreach ($img in $images) {
        $w = if ($img.Size -ge 256) { 0 } else { [byte]$img.Size }
        $bw.Write([byte]$w)
        $bw.Write([byte]$w)
        $bw.Write([byte]0)
        $bw.Write([byte]0)
        $bw.Write([uint16]1)
        $bw.Write([uint16]32)
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

if (-not (Test-Path $SourcePath)) {
    throw "Source image not found at $SourcePath. Save your icon as source.png in this folder, then re-run the script."
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
$source = [System.Drawing.Bitmap]::FromFile($SourcePath)

try {
    # PNG variants Tauri references in tauri.conf.json
    $pngTargets = @{ 32 = "32x32.png"; 128 = "128x128.png"; 256 = "128x128@2x.png" }
    foreach ($k in $pngTargets.Keys) {
        $bmp = Resize-IconBitmap -Source $source -Size $k
        Save-Png -Bmp $bmp -Path (Join-Path $here $pngTargets[$k])
        $bmp.Dispose()
    }

    # Default icon.png used by the tray icon at runtime
    $bmp256 = Resize-IconBitmap -Source $source -Size 256
    Save-Png -Bmp $bmp256 -Path (Join-Path $here "icon.png")
    $bmp256.Dispose()

    # Multi-resolution ICO for the Windows .exe and taskbar
    New-Ico -Source $source -Sizes @(16, 32, 48, 64, 128, 256) -Path (Join-Path $here "icon.ico")
} finally {
    $source.Dispose()
}

Write-Output "Tauri icons generated from source.png."
