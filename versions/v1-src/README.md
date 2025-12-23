# BodySense - Shoulder Warmup App

A 1:1 replica of the shoulder warmup routine interface for animation testing in Figma.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Place your images in the `public` folder:
   - `woman-image.png` - Your woman image with transparent background
   - `Dynamic Island.png` - The iPhone status bar image with Dynamic Island, clock, and battery

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the local URL (usually http://localhost:5173)

## Features

- Exact iPhone 13/14 dimensions (390px × 844px)
- Status bar with Dynamic Island
- Numbered circular overlays on the image
- Bottom navigation with back, Start, and menu buttons
- Responsive styling matching the original design

## Customization

The overlay positions can be adjusted in `src/App.css` by modifying the `.overlay-1` through `.overlay-4` classes.

## Deployment

The project is automatically deployed via GitHub webhook to `https://bodysense.codelabhaven.com/`

## Exercise Default Positions

Each exercise has its own default circle positions that are automatically saved and loaded.

