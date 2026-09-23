const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint API untuk memproses link
app.post('/api/fetch-data', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ 
            success: false, 
            message: 'URL target tidak boleh kosong.' 
        });
    }

    try {
        // Menggunakan endpoint solver alternatif (misal: Lootlabs/Platoboost Solver)
        // Catatan: Jika API ini meminta API Key, tambahkan di parameter/header
        const response = await axios.get(`https://api.bypass.city/bypass`, {
            params: { url: url },
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        console.log('Response Solver API:', response.data);

        const resultKey = response.data?.result || response.data?.key || response.data?.destination || response.data?.url;

        // Cek apakah balasan API berisi pesan shutdown/iklan
        if (typeof resultKey === 'string' && (resultKey.includes('SHUT DOWN') || resultKey.includes('FREE API'))) {
            return res.status(503).json({
                success: false,
                message: 'API Solver publik saat ini sedang di-deaktifkan oleh penyedia jasa. Gunakan API key atau endpoint solver pribadi.'
            });
        }

        if (resultKey) {
            return res.json({ 
                success: true, 
                result: resultKey 
            });
        } else {
            return res.status(422).json({ 
                success: false, 
                message: response.data?.message || 'Gagal me-resolve link. Format respon dari solver tidak dikenali.' 
            });
        }
    } catch (error) {
        console.error('Error saat request ke API Solver:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Server solver publik sedang offline atau memblokir request. Silakan ganti ke endpoint API solver yang valid.' 
        });
    }
});

// Tampilan Frontend UI (Tailwind CSS Inline)
app.get('*', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link Resolver Service</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700">
        <h1 class="text-2xl font-bold text-center mb-2 text-indigo-400">Link Resolver Service</h1>
        <p class="text-xs text-gray-400 text-center mb-6">Masukkan link target kamu di bawah untuk diproses.</p>

        <form id="fetchForm" class="space-y-4">
            <div>
                <label for="targetUrl" class="block text-sm font-medium text-gray-300 mb-1">Target URL</label>
                <input 
                    type="url" 
                    id="targetUrl" 
                    placeholder="https://auth.platorelay.com/..." 
                    required 
                    class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-white"
                >
            </div>

            <button 
                type="submit" 
                id="submitBtn" 
                class="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center text-sm"
            >
                <span>Proses Link</span>
            </button>
        </form>

        <div id="resultBox" class="mt-6 hidden">
            <label class="block text-sm font-medium text-gray-300 mb-1">Hasil Key / Link Akhir:</label>
            <div class="flex items-center bg-gray-900 border border-gray-700 rounded-lg p-2.5">
                <input type="text" id="resultInput" readonly class="bg-transparent w-full text-xs text-green-400 font-mono focus:outline-none">
                <button id="copyBtn" onclick="copyResult()" class="ml-2 bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-200">
                    Salin
                </button>
            </div>
        </div>

        <div id="statusMessage" class="mt-4 text-xs text-center hidden"></div>
    </div>

    <script>
        const form = document.getElementById('fetchForm');
        const submitBtn = document.getElementById('submitBtn');
        const resultBox = document.getElementById('resultBox');
        const resultInput = document.getElementById('resultInput');
        const statusMessage = document.getElementById('statusMessage');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('targetUrl').value;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Memproses...</span>';
            resultBox.classList.add('hidden');
            statusMessage.classList.add('hidden');

            try {
                const response = await fetch('/api/fetch-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                const data = await response.json();

                if (data.success) {
                    resultInput.value = data.result;
                    resultBox.classList.remove('hidden');
                } else {
                    showStatus(data.message || 'Gagal memproses link.', 'text-red-400');
                }
            } catch (err) {
                showStatus('Terjadi masalah koneksi ke server.', 'text-red-400');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Proses Link</span>';
            }
        });

        function showStatus(msg, colorClass) {
            statusMessage.textContent = msg;
            statusMessage.className = \`mt-4 text-xs text-center \${colorClass}\`;
            statusMessage.classList.remove('hidden');
        }

        function copyResult() {
            resultInput.select();
            document.execCommand('copy');
            const copyBtn = document.getElementById('copyBtn');
            copyBtn.textContent = 'Tersalin!';
            setTimeout(() => { copyBtn.textContent = 'Salin'; }, 2000);
        }
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
