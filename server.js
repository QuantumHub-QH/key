const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint to fetch data
app.post('/api/fetch-data', async (req, res) => {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
    }

    try {
        // SECURITY WARNING: This is an open proxy endpoint. 
        // In a production environment, this is vulnerable to Server-Side Request Forgery (SSRF).
        // You should implement an allowlist of permitted domains or endpoints here.
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return res.status(400).json({ error: 'Only HTTP/HTTPS protocols are allowed' });
        }

        const response = await axios.get(url, { timeout: 15000 });
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Fetch error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch data', details: error.message });
    }
});

// Serve frontend UI
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fetch Boilerplate</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center p-4 text-gray-800">
    <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 class="text-2xl font-bold text-center mb-6 text-blue-600">Data Fetcher</h1>
        
        <form id="fetchForm" class="space-y-4">
            <div>
                <label for="urlInput" class="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                <input 
                    type="url" 
                    id="urlInput" 
                    required 
                    placeholder="https://api.example.com/data" 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
            </div>
            
            <button 
                type="submit" 
                id="submitBtn" 
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center"
            >
                <span>Fetch Data</span>
            </button>
        </form>

        <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Response JSON:</label>
            <textarea 
                id="resultBox" 
                readonly 
                class="w-full h-48 bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm font-mono text-gray-600 focus:outline-none"
                placeholder="Result will appear here..."
            ></textarea>
        </div>
    </div>

    <script>
        const form = document.getElementById('fetchForm');
        const submitBtn = document.getElementById('submitBtn');
        const resultBox = document.getElementById('resultBox');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('urlInput').value;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Fetching...';
            resultBox.value = 'Please wait...';

            try {
                const res = await fetch('/api/fetch-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                
                const data = await res.json();
                resultBox.value = JSON.stringify(data, null, 2);
            } catch (err) {
                resultBox.value = 'Error connecting to server: ' + err.message;
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Fetch Data';
            }
        });
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(\`Server is running on port \${PORT}\`);
});
