<?php
// webhook-handler.php for BodySense deployment
// Place this at: https://codelabhaven.com/gh-hooks/webhook-handler.php

// Set execution time limit
set_time_limit(300); // 5 minutes

// Log file
$logFile = __DIR__ . '/webhook.log';

function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

// Get the payload
$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

// Verify it's a push to main branch
if (!isset($data['ref']) || $data['ref'] !== 'refs/heads/main') {
    logMessage('Not a push to main branch, skipping');
    http_response_code(200);
    exit('Not main branch');
}

logMessage('Webhook received for main branch');

// Paths - UPDATE THESE TO MATCH YOUR SERVER
$repoPath = '/home/u123456789/domains/bodysense.codelabhaven.com/repo'; // Where to clone the repo
$publicHtml = '/home/u123456789/domains/bodysense.codelabhaven.com/public_html'; // Where to deploy
$gitUrl = 'https://github.com/Matej398/BodySense.git';

// Create repo directory if it doesn't exist
if (!is_dir($repoPath)) {
    mkdir($repoPath, 0755, true);
    logMessage("Created repo directory: $repoPath");
}

// Change to repo directory
chdir($repoPath);

// Clone or pull the repository
if (is_dir($repoPath . '/.git')) {
    logMessage('Pulling latest changes...');
    $output = shell_exec('git pull origin main 2>&1');
    logMessage("Git pull output: $output");
} else {
    logMessage('Cloning repository...');
    $output = shell_exec("git clone $gitUrl . 2>&1");
    logMessage("Git clone output: $output");
}

// Install dependencies
logMessage('Installing dependencies...');
$output = shell_exec('npm install 2>&1');
logMessage("NPM install output: $output");

// Build the project
logMessage('Building project...');
$output = shell_exec('npm run build 2>&1');
logMessage("Build output: $output");

// Check if dist folder exists
$distPath = $repoPath . '/dist';
if (!is_dir($distPath)) {
    logMessage('ERROR: dist folder not found after build!');
    http_response_code(500);
    exit('Build failed - dist folder not found');
}

// Copy dist contents to public_html
logMessage('Deploying to public_html...');
$output = shell_exec("cp -r $distPath/* $publicHtml/ 2>&1");
logMessage("Copy output: $output");

// Copy .htaccess if it exists
if (file_exists($repoPath . '/public/.htaccess')) {
    copy($repoPath . '/public/.htaccess', $publicHtml . '/.htaccess');
    logMessage('Copied .htaccess file');
}

logMessage('Deployment complete!');
http_response_code(200);
echo 'Deployment successful!';
?>



