# Landing Justice

Landing page keadilan ini menyajikan intro beranimasi dengan persentase dan progress
bar di atas tekstur kertas. Saat loader naik, seluruh landing page ikut bergerak
dari bawah agar transisinya terasa menyambung ke artwork hero. Latar, judul, dan
patung membentuk lapisan 3D yang bergerak mengikuti kursor; daftar prinsip juga
memberi respons tilt 3D saat diarahkan.

## Menjalankan

Jalankan dari folder proyek:

```bash
npm start
```

Buka **http://localhost:3000/** untuk melihat versi yang benar-benar dijalankan.
Jangan buka `broken_visual_artwork_landing_page.html` untuk preview akhir; file itu
hanya referensi desain. Server menggunakan Node.js bawaan dan tidak memerlukan
`npm install`; font DM Sans dan Playfair Display dimuat dari Google Fonts.

## Aset

Artwork dan komponennya berada di `public/`. Ganti `public/img/hero-bg.jpg` atau
`public/img/statue.png` untuk memperbarui lapisan visual. Tekstur layar loading
menggunakan `public/img/loading.jpg`.
