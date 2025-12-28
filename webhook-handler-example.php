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

// dist folder is now included in git, no need to build on server
$out[] = "Deployment complete - dist folder pulled from git";

http_response_code($code === 0 ? 200 : 500);
echo implode("\n", $out);
