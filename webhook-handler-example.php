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

$input = file_get_contents('php://input');
$data = json_decode($input, true);
$repo = $data['repository']['name'] ?? '';

if (!isset($map[$repo])) {
  http_response_code(404);
  echo "Unknown repo: $repo";
  exit;
}

$path = $map[$repo];

// Pull latest code
$cmd = "cd $path && git pull origin main 2>&1";
exec($cmd, $out, $code);

// If pull succeeded and it's a Node.js project (has package.json), run build
if ($code === 0 && file_exists("$path/package.json")) {
  // Find npm and node location
  exec("which npm 2>&1", $whichNpm);
  exec("which node 2>&1", $whichNode);
  exec("node --version 2>&1", $nodeVersion);
  exec("npm --version 2>&1", $npmVersion);
  
  $npm = (!empty($whichNpm[0])) ? trim($whichNpm[0]) : '/usr/bin/npm';
  $out[] = "Node: " . (isset($whichNode[0]) ? trim($whichNode[0]) : 'not found') . " " . (isset($nodeVersion[0]) ? trim($nodeVersion[0]) : '');
  $out[] = "NPM: $npm " . (isset($npmVersion[0]) ? trim($npmVersion[0]) : '');
  
  // Clean node_modules to avoid ENOTEMPTY errors
  $out[] = "Cleaning node_modules...";
  // Use find + delete for more reliable removal
  exec("find $path/node_modules -type f -delete 2>&1; find $path/node_modules -type d -empty -delete 2>&1; rm -rf $path/node_modules 2>&1", $cleanOut, $cleanCode);
  // Also clear npm cache for this project
  exec("$npm cache clean --force 2>&1", $cacheOut, $cacheCode);
  
  // Run npm install
  $out[] = "Running npm install...";
  $installCmd = "cd $path && $npm install 2>&1";
  exec($installCmd, $installOut, $installCode);
  $out = array_merge($out, $installOut);
  
  if ($installCode !== 0) {
    $out[] = "npm install failed with code: $installCode";
    $code = $installCode;
  } else {
    // Run npm build
    $out[] = "Running npm run build...";
    $buildCmd = "cd $path && $npm run build 2>&1";
    exec($buildCmd, $buildOut, $buildCode);
    $out = array_merge($out, $buildOut);
    if ($buildCode !== 0) {
      $out[] = "npm run build failed with code: $buildCode";
    }
    $code = $buildCode;
  }
}

http_response_code($code === 0 ? 200 : 500);
echo implode("\n", $out);
