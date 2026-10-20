$ErrorActionPreference = 'Stop'

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://127.0.0.1:8000/')
$listener.Start()
$rootPath = [System.IO.Path]::GetFullPath($PSScriptRoot) + [System.IO.Path]::DirectorySeparatorChar

Write-Host 'Serving this folder at http://127.0.0.1:8000/ (Ctrl+C to stop)'

$contentTypes = @{
  '.css' = 'text/css; charset=utf-8'
  '.html' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.svg' = 'image/svg+xml'
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    if ($context.Request.HttpMethod -notin @('GET', 'HEAD')) {
      $context.Response.StatusCode = 405
      $context.Response.Close()
      continue
    }

    $relativePath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($relativePath)) {
      $relativePath = 'index.html'
    }

    $filePath = [System.IO.Path]::GetFullPath((Join-Path $rootPath $relativePath))
    if (-not $filePath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
      $context.Response.StatusCode = 404
      $context.Response.Close()
      continue
    }

    if (-not [System.IO.File]::Exists($filePath)) {
      $context.Response.StatusCode = 404
      $context.Response.Close()
      continue
    }

    $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
    if (-not $contentTypes.ContainsKey($extension)) {
      $context.Response.StatusCode = 415
      $context.Response.Close()
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $context.Response.ContentType = $contentTypes[$extension]
    $context.Response.ContentLength64 = $bytes.Length
    if ($context.Request.HttpMethod -eq 'GET') {
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $context.Response.Close()
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
