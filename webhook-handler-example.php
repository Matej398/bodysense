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
$escapedPath = escapeshellarg($path);

// Create a temporary git config file
$tempConfig = '/tmp/gitconfig_' . uniqid();
file_put_contents($tempConfig, "[safe]\n\tdirectory = $path\n");

// Use GIT_CONFIG environment variable to use our custom config
$env = "GIT_CONFIG_GLOBAL=$tempConfig GIT_CONFIG_SYSTEM=$tempConfig ";

// Try git pull with the custom config
$cmd = "cd $escapedPath && $env git pull origin main 2>&1";
exec($cmd, $out, $code);

// Clean up temp config
@unlink($tempConfig);

// If that failed, try with -c flag as backup
if ($code !== 0) {
  $cmd2 = "cd $escapedPath && git -c safe.directory=$escapedPath pull origin main 2>&1";
  exec($cmd2, $out2, $code2);
  if ($code2 === 0) {
    $out = $out2;
    $code = $code2;
  }
}

http_response_code($code === 0 ? 200 : 500);
echo implode("\n", $out);
