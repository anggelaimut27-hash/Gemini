export default {
  async fetch(request, env) {
    // =================================================================
    // ISI API KEY DI SINI
    // =================================================================
    const apiKey = "GANTI_KODE_AIZA_DISINI"; 
    // =================================================================

    const url = new URL(request.url);
    const userPrompt = url.searchParams.get("tanya");
    const selectedModel = url.searchParams.get("model");

    // --- BAGIAN 1: TAMPILAN UTAMA (MENGAMBIL SEMUA MODEL) ---
    if (!userPrompt) {
      
      let optionsHtml = "";
      let statusPesan = "Mengambil data mentah dari Google...";

      try {
        // 1. Minta daftar SEMUA model ke Google
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listResponse.json();

        if (listData.models) {
          // 2. TANPA FILTER. Semua model diambil.
          // Kita hanya menghapus tulisan "models/" di depan namanya agar rapi di URL nanti
          const availableModels = listData.models.map(m => m.name.replace("models/", ""));

          // 3. Buat Dropdown
          optionsHtml = availableModels.map(m => {
            // Jika ada model 'gemini-1.5-flash', jadikan default biar enak.
            // Tapi kalau tidak ada, item pertama yang jadi default.
            const isSelected = m.includes("gemini-1.5-flash") ? "selected" : "";
            return `<option value="${m}" ${isSelected}>${m}</option>`;
          }).join('');
          
          statusPesan = `Ditemukan ${availableModels.length} model (Tanpa Filter).`;
        } else {
          optionsHtml = `<option value="gemini-1.5-flash">Gagal load (Default: Flash)</option>`;
          statusPesan = "Gagal mengambil data. Cek API Key.";
        }

      } catch (e) {
        optionsHtml = `<option value="gemini-1.5-flash">Error Koneksi (Default: Flash)</option>`;
        statusPesan = "Error koneksi ke server Google.";
      }

      // 4. Tampilkan HTML
      const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>All Models Unlocked</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #eaeaea; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          h2 { margin-top: 0; }
          .status { font-size: 0.9em; color: #555; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          label { font-weight: bold; display: block; margin-top: 15px; }
          select, input, button { width: 100%; padding: 12px; margin-top: 5px; font-size: 16px; }
          button { background: #d32f2f; color: white; border: none; font-weight: bold; cursor: pointer; margin-top: 20px; }
          button:hover { background: #b71c1c; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Google AI Models (Raw)</h2>
          <div class="status">${statusPesan}</div>
          
          <form method="GET">
            <label for="model">Pilih Model (Semua Tampil):</label>
            <select name="model" id="model">
              ${optionsHtml}
            </select>

            <label for="tanya">Prompt:</label>
            <input type="text" name="tanya" id="tanya" placeholder="Ketik perintah..." required>

            <button type="submit">Jalankan Request</button>
          </form>
        </div>
      </body>
      </html>
      `;
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }

    // --- BAGIAN 2: PROSES REQUEST ---
    try {
      let modelToUse = selectedModel || "gemini-1.5-flash";

      // Request ke model yang dipilih
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }]
        })
      });

      const data = await response.json();

      if (data.error) {
        return new Response("ERROR DARI MODEL (" + modelToUse + "):\n" + data.error.message, { 
          headers: { "content-type": "text/plain" } 
        });
      }

      if (data.candidates) {
        return new Response(data.candidates[0].content.parts[0].text, {
          headers: { "content-type": "text/plain" }
        });
      } else {
        return new Response("Model tidak memberikan output teks (Mungkin model ini bukan untuk teks/chat).", { 
            headers: { "content-type": "text/plain" } 
        });
      }

    } catch (e) {
      return new Response("Error Sistem: " + e.message, { status: 500 });
    }
  }
};
