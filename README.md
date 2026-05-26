# Dashboard Desa Wisata Indonesia

Dashboard interaktif untuk Kementerian Pariwisata yang menampilkan data 6,207 desa wisata di Indonesia.

**Update:** 25 Mei 2026  
**Author:** Raja Reinhard

---

## 📁 Struktur File

```
vercel-dashboard/
├── index.html              # Main HTML file
├── style.css              # Stylesheet
├── script.js              # JavaScript logic
├── data.json              # 6,207 desa wisata records
├── delineation.json       # 13 kawasan prioritas
├── package.json           # NPM configuration
├── vercel.json            # Vercel deployment config
└── README.md              # This file
```

---

## 🚀 Deployment ke Vercel

### Option 1: Connect GitHub Repository (Recommended)

1. **Push folder ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial dashboard commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dashboard-desa-wisata.git
   git push -u origin main
   ```

2. **Deploy di Vercel:**
   - Buka [vercel.com](https://vercel.com)
   - Klik "New Project"
   - Import repository GitHub
   - Klik "Deploy"
   - Custom domain (optional)

### Option 2: Direct Upload (Fastest)

1. **Download folder `vercel-dashboard`**
2. **Buka [vercel.com](https://vercel.com)**
3. **Drag & drop folder ke Vercel**
4. **Auto-deploy, selesai!**

---

## 🔧 Local Testing

### Run locally:
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server
```

Buka http://localhost:8000 di browser

---

## 📊 Data

**Total:** 6,207 desa wisata  
**Dalam Kawasan Prioritas:** 1,027 desa (16.5%)

### 13 Kawasan (10 DPP + 3 DR)
- 🟣 DPP Borobudur: 199
- 🟣 DPP Mandalika: 178
- 🔵 DR Bali: 155
- 🟣 DPP Danau Toba: 119
- 🟣 DPP Bangka Belitung: 99
- 🟣 DPP Bromo-Tengger-Semeru: 96
- 🔵 DR Greater Jakarta: 66
- 🟣 DPP Likupang: 45
- 🔵 DR Kepulauan Riau: 24
- 🟣 DPP Labuan Bajo: 18
- 🟣 DPP Raja Ampat: 12
- 🟣 DPP Wakatobi: 11
- 🟣 DPP Morotai: 5

---

## ⚙️ Features

- **Search & Filter:** Cari berdasarkan nama, provinsi, kawasan, awards
- **Tabel Interaktif:** Sort, pagination, detail modal
- **Peta:** Leaflet dengan layer interaktif
- **Analitik:** 8 chart dengan breakdown by kawasan
- **Download:** Excel, CSV, JSON, GeoJSON, PNG, Summary
- **Responsive:** Mobile-friendly interface
- **Fast:** 2-3 second load time

---

## 🎨 Teknologi

- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **Maps:** Leaflet 1.9.4
- **Export:** XLSX, html2canvas
- **UI:** Custom dark theme with CSS variables
- **Performance:** Deferred loading, pagination

---

## 🔐 Security

- Client-side rendering (no backend needed)
- Static files only
- No database connection required
- Safe for production

---

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📝 Notes

- Data updated: 25 Mei 2026
- Performance: Fast initial load with on-demand rendering
- Mobile optimized: Full functionality on mobile devices
- Offline capable: Can work offline after first load

---

## 👤 Contact

Untuk pertanyaan atau update data:
- Contact: Raja Reinhard
- Update: 25 Mei 2026

---

## 📄 License

MIT License - Feel free to use and modify
