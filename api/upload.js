// api/upload.js
import { put, list } from '@vercel/blob';

// 🔧 Helper: Generar ID único (con canción opcional)
function generateId(artist, album, song) {
    const clean = (str) => str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    
    let result = `${clean(artist)}_${clean(album)}`;
    if (song && song.trim()) {
        result += `_${clean(song)}`;
    }
    return result;
}

// 🔧 Helper: Obtener extensión del archivo
function getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : 'mp4';
}

// 📤 Handler principal
export default async function handler(req, res) {
    console.log('📤 Upload function called');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
    }

    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error('❌ Falta BLOB_READ_WRITE_TOKEN');
            return res.status(500).json({
                success: false,
                error: 'Configuración de Blob Storage incompleta'
            });
        }

        const { fields, files } = await parseMultipartFormData(req);
        
        console.log('📤 Fields:', Object.keys(fields));
        console.log('📤 Files:', Object.keys(files));

        // ✅ Artist y album son obligatorios, song es opcional
        if (!fields.artist || !fields.album) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: artist, album (song es opcional)'
            });
        }

        if (!files.video) {
            return res.status(400).json({
                success: false,
                error: 'Falta el archivo de video'
            });
        }

        // ✅ Validar tamaño (6MB máximo)
        if (files.video.size > 6 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                error: 'El archivo de video debe ser menor a 6MB'
            });
        }

        const artist = fields.artist.trim();
        const album = fields.album.trim();
        const song = fields.song ? fields.song.trim() : ''; // ✅ Opcional
        const videoFile = files.video;

        console.log('📤 Procesando:', { artist, album, song: song || '(sin canción)', filename: videoFile.filename });

        const id = generateId(artist, album, song);
        const fileExt = getFileExtension(videoFile.filename);
        const fileName = `canvases/${id}.${fileExt}`;

        // 📤 Guardar en Vercel Blob
        const fileBuffer = Buffer.from(videoFile.content, 'base64');
        const blob = await put(fileName, fileBuffer, {
            access: 'public',
            contentType: videoFile.contentType || 'video/mp4'
        });

        console.log('✅ Archivo guardado:', blob.url);

        // 📝 Leer índice actual
        let indexData = { canvases: [] };
        try {
            const blobs = await list({ prefix: 'canvases/' });
            const indexBlob = blobs.blobs.find(b => b.pathname === 'canvases/index.json');
            if (indexBlob) {
                const response = await fetch(indexBlob.url);
                if (response.ok) {
                    indexData = await response.json();
                    console.log('📖 Índice cargado:', indexData.canvases.length);
                }
            }
        } catch (e) {
            console.log('📝 Creando nuevo índice...');
        }

        // Crear entrada
        const newEntry = {
            id: id,
            artist: artist,
            album: album,
            song: song || '', // ✅ Guardar vacío si no hay canción
            url: blob.url,
            type: fileExt,
            uploadedAt: new Date().toISOString()
        };

        const existingIndex = indexData.canvases.findIndex(c => c.id === id);
        if (existingIndex !== -1) {
            indexData.canvases[existingIndex] = { ...newEntry, updatedAt: new Date().toISOString() };
            console.log('🔄 Actualizando entrada existente');
        } else {
            indexData.canvases.push(newEntry);
            console.log('➕ Nueva entrada agregada');
        }

        // Guardar índice actualizado
        await put('canvases/index.json', JSON.stringify(indexData, null, 2), {
            access: 'public',
            contentType: 'application/json'
        });

        console.log('💾 Índice guardado');

        return res.status(200).json({
            success: true,
            id: id,
            url: blob.url,
            artist: artist,
            album: album,
            song: song || '',
            message: 'Canvas subido correctamente'
        });

    } catch (error) {
        console.error('❌ Error en upload:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno: ' + error.message
        });
    }
}

// 🔧 Función para parsear multipart/form-data
async function parseMultipartFormData(req) {
    const fields = {};
    const files = {};

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);
    
    if (bodyBuffer.length === 0) {
        return { fields, files };
    }

    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
        throw new Error('No se encontró boundary en Content-Type');
    }

    const boundary = boundaryMatch[1];
    const body = bodyBuffer.toString('binary');
    const parts = body.split(`--${boundary}`);

    for (const part of parts) {
        if (part.trim() === '' || part.trim() === '--') continue;

        const headerEndIndex = part.indexOf('\r\n\r\n');
        if (headerEndIndex === -1) continue;

        const headersPart = part.substring(0, headerEndIndex);
        const content = part.substring(headerEndIndex + 4);

        const nameMatch = headersPart.match(/name="([^"]+)"/);
        if (!nameMatch) continue;
        const name = nameMatch[1];

        const filenameMatch = headersPart.match(/filename="([^"]+)"/);

        if (filenameMatch) {
            const filename = filenameMatch[1];
            const contentTypeMatch = headersPart.match(/Content-Type: ([^\r\n]+)/);
            const contentTypeValue = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
            
            const cleanContent = content.replace(/\r\n$/, '');
            
            files[name] = {
                filename: filename,
                contentType: contentTypeValue,
                content: Buffer.from(cleanContent, 'binary').toString('base64'),
                size: cleanContent.length
            };
        } else {
            fields[name] = content.replace(/\r\n$/, '').trim();
        }
    }

    return { fields, files };
}