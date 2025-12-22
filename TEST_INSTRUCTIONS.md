# How to Test Locally

## Step 1: Install Dependencies

Open a terminal (Command Prompt or PowerShell) in this directory and run:

```bash
npm install
```

**If you get a PowerShell execution policy error**, you have two options:

### Option A: Use Command Prompt instead
1. Press `Win + R`
2. Type `cmd` and press Enter
3. Navigate to this folder: `cd C:\Users\Matej\Desktop\codelabhaven\projects\bodysense`
4. Run `npm install`

### Option B: Enable PowerShell scripts (one-time setup)
Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then try `npm install` again.

## Step 2: Add Your Image

Place your woman image file in the `public` folder and name it `woman-image.jpg`

## Step 3: Start the Development Server

Run:
```bash
npm run dev
```

## Step 4: Open in Browser

The terminal will show a URL like `http://localhost:5173` - open this in your browser.

The app will automatically reload when you make changes to the code.

## Troubleshooting

- **Port already in use?** Vite will automatically try the next available port
- **Image not showing?** Make sure the image is named exactly `woman-image.jpg` and is in the `public` folder
- **Need to stop the server?** Press `Ctrl + C` in the terminal


