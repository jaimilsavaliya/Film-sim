# 🎞️ FilmSim - Quick Start Guide

## What You've Got

A fully functional film simulation photo editor with:
- ✅ 24 authentic film stocks (Portra, Velvia, Tri-X, CineStill, etc.)
- ✅ Real-time WebGL2 processing
- ✅ 3D LUT color grading from actual .cube files
- ✅ Film grain, softness, halation, vignette effects
- ✅ Full adjustment controls (exposure, contrast, saturation, etc.)
- ✅ Before/after comparison slider
- ✅ High-quality PNG export
- ✅ Mobile responsive + desktop optimized
- ✅ 100% client-side (privacy-first)

## 🚀 Running the App

The dev server is already running at:
```
http://localhost:3000
```

## 📸 How to Use

### 1. Upload an Image
- Click **Upload** button in the top bar, OR
- **Drag & drop** any image onto the canvas, OR
- Click one of the **sample images** (Portrait or Landscape)

### 2. Select a Film Stock
- Browse films in the **left panel**
- Use the **category tabs** to filter (Color Negative, Slide Film, B&W, Cinema, Fuji X-Trans III)
- **Search** for specific films by name
- Click any film card to apply it

### 3. Adjust the Look
- Use the **right panel** controls:
  - **Film tab**: Adjust intensity (0-100%)
  - **Adjust tab**: Exposure, contrast, highlights, shadows, saturation, temperature
  - **Effects tab**: Grain, softness, halation, vignette

### 4. Compare
- Click **Compare** button to toggle before/after slider
- Drag the divider to compare original vs edited

### 5. Export
- Click **Export** to download as high-quality PNG

## 🎨 Film Categories

### Color Negative (8 films)
Warm, natural tones. Great for portraits and everyday photography.
- **Portra 160/400/800**: Legendary skin tones
- **Ektar 100**: Vivid saturated colors
- **Gold 200**: Classic Kodak warmth
- **Fuji Pro 160C, 400H, Superia 200**: Cool, pastel tones

### Slide Film (5 films)
Vivid, punchy colors with high contrast. Perfect for landscapes.
- **Velvia 50/100**: Ultra-saturated, legendary for landscapes
- **Provia 100F**: Natural accurate colors
- **Kodachrome 64**: Iconic archival warmth
- **Ektachrome 100VS**: Vivid slide colors

### Black & White (5 films)
Classic monochrome looks.
- **HP5 Plus**: Medium grain, versatile
- **Delta 400**: Fine grain, sharp
- **Neopan Acros 100**: Ultra-fine, smooth
- **Tri-X 400**: Gritty, documentary
- **APX 100**: Neutral European classic

### Cinema (2 films)
Cinematic color with halation glow.
- **CineStill 500T**: Tungsten, night scenes
- **CineStill 800T**: High-speed, moody

### Fuji X-Trans III (4 films)
Digital simulations of Fuji's film simulations.
- **Classic Chrome**: Muted documentary style
- **Astia**: Soft pastels
- **Acros**: Fine B&W
- **Velvia**: Vivid colors

## 🎛️ Effects Explained

- **Grain**: Procedural film grain, more visible in shadows
- **Softness**: Gaussian blur for dreamy look
- **Halation**: Bloom/glow around bright areas (cinema films)
- **Vignette**: Darkened corners for focus

## 📱 Mobile Usage

On mobile devices:
- Bottom toolbar has **Films** and **Adjust** buttons
- Tap to open slide-up panels
- All controls work the same way

## 🔧 Technical Details

- **Rendering**: WebGL2 with GLSL shaders
- **LUT Size**: 13×13×13 (2197 color samples per film)
- **Color Space**: sRGB ↔ Linear conversion
- **Processing**: Real-time at up to 2048px preview resolution
- **Export**: Full resolution PNG

## 🎯 Tips

1. **Start with intensity at 100%** then reduce if too strong
2. **Portra 400** is a great all-rounder for portraits
3. **Velvia 50** is perfect for landscapes
4. **CineStill 500T** looks amazing on night/city scenes
5. **Tri-X 400** gives classic B&W documentary look
6. Add **grain + softness + halation** for authentic analog feel
7. Use **Compare** to check your edits

## 🚀 Next Steps

Try:
- Upload your own photos
- Experiment with different films
- Stack effects (grain + halation + vignette)
- Adjust intensity for subtle looks
- Compare before/after

## 🐛 Troubleshooting

**WebGL not supported?**
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Update your graphics drivers

**Slow performance?**
- Large images may be slower
- Reduce browser zoom to 100%
- Close other tabs/apps

**Image won't upload?**
- Check file format (JPEG, PNG, WebP)
- Try a smaller file size
- Refresh the page

---

**Enjoy your film simulation editing!** 🎞️✨
