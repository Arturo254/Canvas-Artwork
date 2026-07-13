// api/list.js
import { list } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido. Usa GET.' });
    }

    try {
        // Verificar token
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return res.status(500).json({
                success: false,
                error: 'Configuración de Blob Storage incompleta'
            });
        }

        // 📋 Listar todos los blobs en la carpeta 'canvases/'
        const blobs = await list({
            prefix: 'canvases/'
        });

        // 🔍 Buscar el archivo index.json
        let indexData = { canvases: [] };
        const indexBlob = blobs.blobs.find(b => b.pathname === 'canvases/index.json');

        if (indexBlob) {
            // Descargar el contenido de index.json
            const response = await fetch(indexBlob.url);
            if (response.ok) {
                indexData = await response.json();
                console.log('📖 Índice cargado:', indexData.canvases.length);
            }
        }

        // Ordenar por fecha
        const canvases = (indexData.canvases || []).sort((a, b) => {
            const aDate = a.uploadedAt || a.updatedAt || '';
            const bDate = b.uploadedAt || b.updatedAt || '';
            return bDate.localeCompare(aDate);
        });

        return res.status(200).json({
            success: true,
            total: canvases.length,
            canvases: canvases
        });

    } catch (error) {
        console.error('❌ Error en list:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno: ' + error.message
        });
    }
}