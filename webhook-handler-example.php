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

// Get the current user (web server user) - with fallback
$homeDir = '/tmp';
if (function_exists('posix_geteuid') && function_exists('posix_getpwuid')) {
  $currentUser = posix_getpwuid(posix_geteuid());
  $homeDir = $currentUser['dir'] ?? '/tmp';
}

// Try multiple approaches to set safe.directory
// Method 1: Use -c flag directly (most reliable)
$cmd = "cd $escapedPath && git -c safe.directory=$escapedPath pull origin main 2>&1";
exec($cmd, $out, $code);

// Method 2: If that fails, try with HOME set
if ($code !== 0) {
  $cmd2 = "cd $escapedPath && HOME=$homeDir git -c safe.directory=$escapedPath pull origin main 2>&1";
  exec($cmd2, $out2, $code2);
  if ($code2 === 0) {
    $out = $out2;
    $code = $code2;
  }
}

// Method 3: Try setting it in a temp config file first
if ($code !== 0) {
  $tempConfig = '/tmp/gitconfig_' . getmypid();
  file_put_contents($tempConfig, "[safe]\n\tdirectory = $path\n");
  $cmd3 = "cd $escapedPath && GIT_CONFIG_GLOBAL=$tempConfig git pull origin main 2>&1";
  exec($cmd3, $out3, $code3);
  @unlink($tempConfig);
  if ($code3 === 0) {
    $out = $out3;
    $code = $code3;
  }
}

// Method 4: Try using --git-dir to bypass ownership check
if ($code !== 0) {
  $gitDir = "$path/.git";
  $cmd4 = "git --git-dir=$gitDir --work-tree=$escapedPath -c safe.directory=$escapedPath pull origin main 2>&1";
  exec($cmd4, $out4, $code4);
  if ($code4 === 0) {
    $out = $out4;
    $code = $code4;
  }
}

http_response_code($code === 0 ? 200 : 500);
echo implode("\n", $out);
