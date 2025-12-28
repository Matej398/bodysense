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
  $buildCmd = "cd $path && npm install --silent 2>&1 && npm run build 2>&1";
  exec($buildCmd, $buildOut, $buildCode);
  $out = array_merge($out, $buildOut);
  $code = $buildCode;
}

http_response_code($code === 0 ? 200 : 500);
echo implode("\n", $out);
