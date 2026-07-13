// api/search.js
import { list } from '@vercel/blob';

function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, ' ');
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido. Usa GET.' });
    }

    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return res.status(500).json({
                success: false,
                error: 'Configuración de Blob Storage incompleta'
            });
        }

        const { artist, album, song } = req.query;

        // ✅ Al menos artista o álbum son necesarios
        if (!artist && !album) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere al menos artista o álbum'
            });
        }

        // 📋 Listar todos los blobs
        const blobs = await list({ prefix: 'canvases/' });

        // 🔍 Buscar index.json
        let indexData = { canvases: [] };
        const indexBlob = blobs.blobs.find(b => b.pathname === 'canvases/index.json');

        if (indexBlob) {
            const response = await fetch(indexBlob.url);
            if (response.ok) {
                indexData = await response.json();
            }
        }

        const normalizedArtist = normalizeText(artist || '');
        const normalizedAlbum = normalizeText(album || '');
        const normalizedSong = normalizeText(song || '');

        let bestMatch = null;
        let bestScore = 0;

        for (const canvas of (indexData.canvases || [])) {
            const cArtist = normalizeText(canvas.artist || '');
            const cAlbum = normalizeText(canvas.album || '');
            const cSong = normalizeText(canvas.song || '');

            let score = 0;

            // ✅ PESO 1: Artista (muy importante)
            if (artist) {
                if (cArtist === normalizedArtist) score += 40;
                else if (cArtist.includes(normalizedArtist) || normalizedArtist.includes(cArtist)) score += 20;
            }

            // ✅ PESO 2: Álbum (muy importante)
            if (album) {
                if (cAlbum === normalizedAlbum) score += 35;
                else if (cAlbum.includes(normalizedAlbum) || normalizedAlbum.includes(cAlbum)) score += 18;
            }

            // ✅ PESO 3: Canción (solo si se proporcionó)
            if (song && song.trim()) {
                if (cSong === normalizedSong) score += 25;
                else if (cSong.includes(normalizedSong) || normalizedSong.includes(cSong)) score += 12;
            }

            // ✅ Bonus: Si el álbum coincide exactamente con la canción (cuando no hay canción)
            if (!song || !song.trim()) {
                if (cAlbum === cSong && cAlbum !== '') score += 5;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = canvas;
            }
        }

        // ✅ Umbral mínimo: con artista+álbum es más fácil alcanzarlo
        const threshold = (song && song.trim()) ? 25 : 15;

        if (bestMatch && bestScore >= threshold) {
            return res.status(200).json({
                success: true,
                found: true,
                data: bestMatch
            });
        }

        return res.status(200).json({
            success: true,
            found: false,
            data: null
        });

    } catch (error) {
        console.error('❌ Error en search:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno: ' + error.message
        });
    }
}