# 🎞️ FilmSim - Film Simulation Editor

A fast, beautiful browser-based photo editor that applies authentic analog film looks using real 3D LUT color profiles.

![FilmSim](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![WebGL2](https://img.shields.io/badge/WebGL-2-green)

## ✨ Features

- **24 Film Stocks** from legendary manufacturers:
  - 🟠 **Color Negative**: Portra 160/400/800, Ektar 100, Gold 200, Fuji Pro 160C, 400H, Superia 200
  - 🔵 **Slide Film**: Velvia 50/100, Provia 100F, Kodachrome 64, Ektachrome 100VS
  - ⚫ **Black & White**: HP5 Plus, Delta 400, Neopan Acros 100, Tri-X 400, APX 100
  - 🎬 **Cinema**: CineStill 500T/800T
  - 🟣 **Fuji X-Trans III**: Classic Chrome, Astia, Acros, Velvia simulations

- **Real-time WebGL2 Processing**
  - 3D LUT color grading (actual `.cube` files)
  - Procedural film grain
  - Gaussian blur softness/bloom
  - Halation glow effect
  - Vignette

- **Full Adjustment Controls**
  - Exposure, Contrast, Highlights, Shadows
  - Saturation, Temperature
  - Film intensity slider (0–100%)

- **Before/After Comparison** with draggable slider

- **High-Quality Export** as PNG

- **100% Client-Side** — your images never leave the browser

- **Mobile Responsive** + Desktop optimized

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Rendering | Raw WebGL2 + GLSL shaders |
| LUT Source | [Film-Luts](https://github.com/YahiaAngelo/Film-Luts) collection |

## 📁 Project Structure

```
film-sim/
├── app/
│   ├── page.tsx              # Main editor page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── editor/
│       ├── Canvas.tsx         # WebGL canvas + comparison
│       ├── Controls.tsx       # Adjustment sliders
│       ├── FilmBrowser.tsx    # Film stock picker
│       └── Header.tsx         # Top bar + upload/export
├── lib/
│   ├── store.ts              # Zustand state
│   ├── films.ts              # Film catalog
│   └── webgl/
│       ├── renderer.ts       # WebGL2 renderer
│       └── lut-loader.ts     # .cube parser
├── public/
│   └── luts/                 # 24 .cube LUT files
└── types/
```

## 🎨 How It Works

1. **LUT Loading**: `.cube` files are parsed into 3D lookup tables (13×13×13)
2. **Texture Strip**: 3D LUT is flattened into a 2D texture strip for WebGL compatibility
3. **GPU Processing**: Fragment shader performs:
   - sRGB → Linear color space conversion
   - Exposure & temperature adjustments
   - 3D LUT color lookup with trilinear interpolation
   - Contrast, highlight, shadow adjustments
   - Saturation control
   - Procedural film grain
   - Vignette
4. **Post-Processing**: Optional Gaussian blur for softness/halation bloom
5. **Final Composite**: Halation glow additively blended
6. **Output**: Linear → sRGB conversion for display

## 📝 Roadmap

- [ ] Batch processing
- [ ] Preset save/share (URL-based)
- [ ] More film stocks (expand to 70+)
- [ ] HEIC image support
- [ ] Side-by-side before/after export
- [ ] History/undo stack
- [ ] Keyboard shortcuts
- [ ] Custom LUT upload
- [ ] PWA (offline support)

## 🙏 Acknowledgments

- Film LUTs from [YahiaAngelo/Film-Luts](https://github.com/YahiaAngelo/Film-Luts)
- Inspired by the craft of analog photography

## 📄 License

MIT
