# Средняя разница соседних кадров (ffmpeg, 0–255) — метрика мерцания.
# powershell -File tools/frame-diff.ps1 shots/frames/base
param([string]$dir)
$files = Get-ChildItem $dir -Filter f*.png | Sort-Object Name
$vals = @()
for ($i = 1; $i -lt $files.Count; $i++) {
  $out = & ffmpeg -hide_banner -i $files[$i-1].FullName -i $files[$i].FullName -filter_complex "[0][1]blend=all_mode=difference,format=gray,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null - 2>&1
  $m = ($out | Select-String 'YAVG=([\d\.]+)' | Select-Object -Last 1).Matches.Groups[1].Value
  $vals += [double]$m
}
$avg = ($vals | Measure-Object -Average).Average
$max = ($vals | Measure-Object -Maximum).Maximum
"{0}: mean diff {1:N3}, max {2:N3}, frames {3}" -f (Split-Path $dir -Leaf), $avg, $max, $files.Count
