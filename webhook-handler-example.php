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

// Set HOME to /tmp so git config has a writable location
$homeDir = '/tmp';
putenv("HOME=$homeDir");

// First, ensure safe.directory is set in global config
// Use --file to specify the exact config file location
$configFile = "$homeDir/.gitconfig";
$configCmd = "HOME=$homeDir git config --file $configFile --add safe.directory $escapedPath 2>&1";
exec($configCmd, $configOut, $configCode);

// Also try the standard --global approach
$globalCmd = "HOME=$homeDir git config --global --add safe.directory $escapedPath 2>&1";
exec($globalCmd, $globalOut, $globalCode);

// Now try git pull with HOME set and using the config file
$cmd = "cd $escapedPath && HOME=$homeDir git -c safe.directory=$escapedPath pull origin main 2>&1";
exec($cmd, $out, $code);

// If still failing, try with GIT_CONFIG pointing to our config file
if ($code !== 0 && file_exists($configFile)) {
  $cmd2 = "cd $escapedPath && HOME=$homeDir GIT_CONFIG_GLOBAL=$configFile git pull origin main 2>&1";
  exec($cmd2, $out2, $code2);
  if ($code2 === 0) {
    $out = $out2;
    $code = $code2;
  }
}

http_response_code($code === 0 ? 200 : 500);
echo implode("\n", $out);
