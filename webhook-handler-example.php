<?php
// Map repo name -> path to pull
$map = [
  'bodysense'        => '/var/www/html/codelabhaven/projects/bodysense',
  'movie-night'      => '/var/www/html/codelabhaven/projects/movie_night',
  'poorty'           => '/var/www/html/codelabhaven/projects/crypto_folio',
  'cmdhub'           => '/var/www/html/codelabhaven/projects/cmdhub',
  'nyan'             => '/var/www/html/codelabhaven/projects/nyan',
  'pixly'            => '/var/www/html/codelabhaven/projects/pixly',
  'deployment-guide' => '/var/www/html/codelabhaven/projects/deployment_guide',
  'codelabhaven'     => '/var/www/html/codelabhaven'  // main site
];

// Add all directories to safe.directory upfront to avoid "dubious ownership" errors
foreach ($map as $repoName => $repoPath) {
  exec("git config --global --add safe.directory $repoPath 2>&1", $safeDirOut, $safeDirCode);
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);
$repo = $data['repository']['name'] ?? '';

if (!isset($map[$repo])) {
  http_response_code(404);
  echo "Unknown repo: $repo";
  exit;
}

$path = $map[$repo];
// Ensure safe.directory is set (both globally and per-command as backup)
exec("git config --global --add safe.directory '$path' 2>&1", $safeDirOut, $safeDirCode);
// Use -c flag with quoted path to set safe.directory for this specific git command
$cmd = "cd '$path' && git -c safe.directory='$path' pull origin main 2>&1";
exec($cmd, $out, $code);
http_response_code($code === 0 ? 200 : 500);
echo implode("\n", $out);
