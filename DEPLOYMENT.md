# BodySense Deployment Guide

## GitHub Repository
- Repository: https://github.com/Matej398/BodySense
- Subdomain: bodysense.codelabhaven.com

## Setup Instructions

### 1. GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `HOSTINGER_WEBHOOK_URL`: Your Hostinger webhook URL

### 2. Hostinger Webhook Setup

Your webhook should:
1. Receive POST requests from GitHub Actions
2. Pull the latest code from GitHub
3. Run `npm install` and `npm run build`
4. Copy the `dist` folder to your public_html directory

### 3. Hostinger Server Setup

On your Hostinger server, create a deployment script at `/home/u123456789/domains/bodysense.codelabhaven.com/deploy.sh`:

```bash
#!/bin/bash
cd /home/u123456789/domains/bodysense.codelabhaven.com
git pull origin main
npm install
npm run build
cp -r dist/* public_html/
echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

### 4. Webhook Handler (PHP Example)

If your webhook is a PHP script, create `webhook.php`:

```php
<?php
$secret = 'your-webhook-secret';
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE'] ?? '';

// Verify webhook (optional but recommended)
if ($signature) {
    $hash = 'sha1=' . hash_hmac('sha1', $payload, $secret);
    if (!hash_equals($signature, $hash)) {
        http_response_code(401);
        exit('Invalid signature');
    }
}

// Execute deployment
$output = shell_exec('cd /home/u123456789/domains/bodysense.codelabhaven.com && ./deploy.sh 2>&1');
echo $output;
?>
```

### 5. Vite Build Configuration

Make sure your `vite.config.js` has the correct base path:

```javascript
export default {
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}
```

### 6. Testing Deployment

1. Make a change to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Check GitHub Actions tab to see if deployment runs
4. Verify your webhook receives the request
5. Check your subdomain to see if changes are live

## Manual Deployment

If you need to deploy manually:

```bash
npm install
npm run build
# Then upload dist/ folder contents to your Hostinger public_html directory
```

## Troubleshooting

- **Build fails**: Check Node.js version (should be 18+)
- **Webhook not triggering**: Verify webhook URL in GitHub secrets
- **Files not updating**: Check file permissions on Hostinger server
- **404 errors**: Ensure base path in vite.config.js matches your subdomain structure

