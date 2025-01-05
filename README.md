# ActivityTracker

ActivityTracker adalah aplikasi sederhana untuk membantu melacak produktivitas Anda. Dibangun menggunakan HTML, CSS, dan JavaScript, aplikasi ini memungkinkan Anda menambahkan aktivitas, memulai atau menghentikan timer, dan melihat kinerja Anda secara langsung.

## Cara Deploy di VPS
Berikut langkah-langkah untuk menginstal dan menjalankan ActivityTracker di VPS Anda.

### Sebelum Memulai
Pastikan Anda sudah memiliki:
1. Akses ke VPS dengan sistem operasi Linux.
2. `git` terinstal di VPS.
3. Server web seperti `nginx` sudah terinstal.

### Langkah-Langkah

#### 1. Login ke VPS
Gunakan SSH untuk masuk ke VPS Anda:
```bash
ssh username@ip-vps-anda
```

#### 2. Pastikan Prasyarat Terinstal
Periksa dan instal `git` serta `nginx` jika belum tersedia:
```bash
sudo apt update
sudo apt install git nginx -y
```

#### 3. Clone Repository
Download source code ActivityTracker ke VPS Anda:
```bash
git clone https://github.com/Mafuruko/activityTracker.git
```

Masuk ke folder proyek:
```bash
cd activityTracker
```

#### 4. Konfigurasi Nginx
Sekarang kita perlu mengatur Nginx agar bisa melayani aplikasi ini.

1. Buat file konfigurasi baru:
    ```bash
    sudo nano /etc/nginx/sites-available/activityTracker
    ```

2. Masukkan konfigurasi ini:
    ```nginx
    server {
        listen 80;
        server_name domain-anda.com; # Ganti dengan domain atau IP VPS Anda

        root /path/ke/activityTracker; # Ganti dengan path direktori aplikasi
        index index.html;

        location / {
            try_files $uri $uri/ =404;
        }
    }
    ```

3. Aktifkan konfigurasi dengan membuat symlink:
    ```bash
    sudo ln -s /etc/nginx/sites-available/activityTracker /etc/nginx/sites-enabled/
    ```

4. Restart Nginx untuk menerapkan perubahan:
    ```bash
    sudo systemctl restart nginx
    ```

#### 5. Cek Aplikasi
Buka browser Anda, lalu akses domain atau IP VPS Anda:
```
https://activitytracker-vb4w.onrender.com/
```

Kalau semua langkah sudah benar, Anda akan melihat halaman utama ActivityTracker.

#### 6. Tambahkan SSL (Opsional)
Untuk keamanan lebih, Anda bisa menambahkan HTTPS dengan Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domain-anda.com
```
Ikuti petunjuk untuk mendapatkan sertifikat SSL gratis.

### Troubleshooting
- **403 Forbidden**: Pastikan path `root` di konfigurasi Nginx benar.
- **404 Not Found**: Cek apakah file `index.html` ada di direktori aplikasi.

### Kontribusi
Kalau Anda punya ide untuk pengembangan atau menemukan bug, jangan ragu untuk membuka issue atau mengirim pull request di repository ini.
