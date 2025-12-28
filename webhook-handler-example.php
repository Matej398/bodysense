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
// Set safe.directory globally (may fail silently, that's ok)
exec("git config --global --add safe.directory '$path' 2>&1", $safeDirOut, $safeDirCode);
// Use -c flag - this is the most reliable method
// The -c flag sets the config for this single command
$escapedPath = escapeshellarg($path);
$cmd = "cd $escapedPath && git -c safe.directory=$escapedPath pull origin main 2>&1";
exec($cmd, $out, $code);
http_response_code($code === 0 ? 200 : 500);
echo implode("\n", $out);
