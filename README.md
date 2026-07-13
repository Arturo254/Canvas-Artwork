# Canvas Studio 🎨

**Canvas Studio for OpenTune** — Una plataforma web para subir y gestionar videos animados (Canvas) diseñada para integrarse con la aplicación OpenTune.

---

## 📋 Descripción

Canvas Studio es una **Web API** que permite:

- 📤 **Subir videos animados** (MP4, WebM) asociados a canciones
- 🔍 **Buscar Canvas** por artista, álbum y canción
- 📋 **Gestionar** tu colección de Canvas (listar, eliminar)
- 🔌 **Integrarse** con OpenTune a través de una API REST
- 🎬 **Reproducir** los Canvas directamente desde la app

Es la solución perfecta para ampliar la biblioteca de Canvas de OpenTune con contenido personalizado o creado por la comunidad.

---

## 🚀 Características Principales

### 1. API REST Completa
- Endpoints para búsqueda, subida y gestión de Canvas
- Respuestas en JSON con formato claro
- Caché integrada para reducir llamadas repetidas

### 2. Almacenamiento en la Nube
- Videos alojados en **Vercel Blob Storage**
- Acceso público para reproducción directa
- Índice en JSON para búsqueda rápida

### 3. Búsqueda Flexible
- Búsqueda por **Artista + Álbum** (recomendado)
- Búsqueda por **Artista + Álbum + Canción**
- Búsqueda por **Artista** o **Álbum** individual
- Coincidencia parcial para mayor precisión

### 4. Interfaz Web
- Panel de administración visual
- Subida de archivos con arrastrar y soltar
- Vista previa de los Canvas subidos
- Copiar URL y eliminar directamente desde la web

### 5. Integración OpenTune
- Compatible con el sistema de proveedores de Canvas
- Orden de búsqueda: Apple Music → Canvas Studio → Tidal
- Retorna URLs directas para reproducción en ExoPlayer

---

## 🛠 Stack Tecnológico

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **Almacenamiento**: Vercel Blob Storage
- **CDN**: Vercel Edge Network

---

## 🎯 Uso Rápido

### Buscar un Canvas (API)

```bash
# Por artista + álbum
curl "https://opentune-canvas.vercel.app/api/search?artist=Peso%20Pluma&album=DINAST%C3%8DA"

# Por artista + álbum + canción
curl "https://opentune-canvas.vercel.app/api/search?artist=SZA&album=SOS&song=Kill%20Bill"
```

### Subir un Canvas (API)

```bash
curl -X POST "https://opentune-canvas.vercel.app/api/upload" \
  -F "artist=SZA" \
  -F "album=SOS" \
  -F "song=Kill Bill" \
  -F "video=@/ruta/a/tu/video.mp4"
```

### Desde la Web

1. Visita [https://opentune-canvas.vercel.app](https://opentune-canvas.vercel.app)
2. Completa los campos: Artista, Álbum y Canción (opcional)
3. Selecciona tu archivo de video (máx. 6MB)
4. Haz clic en "Subir Canvas"
5. El Canvas aparecerá en la lista y estará disponible para OpenTune

---

## 📡 API Endpoints

### Listar Canvas
```
GET /api/list
```
Devuelve todos los Canvas almacenados.

### Buscar Canvas
```
GET /api/search?artist=X&album=Y&song=Z
```
Busca Canvas por parámetros. Artista y álbum son recomendados, canción es opcional.

### Subir Canvas
```
POST /api/upload
```
Sube un nuevo Canvas. Body: multipart/form-data con `artist`, `album`, `song` (opcional) y `video`.

### Eliminar Canvas
```
DELETE /api/delete
```
Elimina un Canvas por ID. Body JSON: `{ "id": "sza_sos_kill_bill" }`

---

## 📦 Estructura de Datos

### Respuesta de Búsqueda (encontrado)
```json
{
  "success": true,
  "found": true,
  "data": {
    "id": "peso_pluma_dinastia",
    "artist": "Peso Pluma",
    "album": "DINASTÍA",
    "song": "",
    "url": "https://...blob.../peso_pluma_dinastia.mp4",
    "type": "mp4",
    "uploadedAt": "2026-07-12T..."
  }
}
```

### Respuesta de Búsqueda (no encontrado)
```json
{
  "success": true,
  "found": false,
  "data": null
}
```

---

## 🔧 Integración con OpenTune

Canvas Studio se integra como un proveedor más en el sistema de Canvas de OpenTune. El orden de búsqueda es:

1. **Apple Music** (carátulas animadas oficiales)
2. **Canvas Studio** (tu contenido personalizado)
3. **Tidal** (fallback)

### Cómo funciona:
1. OpenTune solicita un Canvas para una canción
2. Busca primero en Apple Music
3. Si no encuentra, consulta Canvas Studio
4. Si no encuentra, prueba Tidal
5. Devuelve la URL del Canvas (o null)

---

## 🚀 Despliegue

El proyecto está desplegado en [Vercel](https://vercel.com) con:

1. **Frontend** en la raíz del proyecto
2. **Serverless Functions** en la carpeta `/api`
3. **Blob Storage** para almacenar videos e índice

### Variables de Entorno
- `BLOB_READ_WRITE_TOKEN` — Token para Vercel Blob Storage
- `BLOB_STORE_ID` — ID de la store (autogenerado)
- `BLOB_WEBHOOK_PUBLIC_KEY` — Clave para webhooks (autogenerado)

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT — ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 💬 Soporte

¿Preguntas o problemas? Abre un [issue](https://github.com/Arturo254/Canvas-Artwork/issues) o contacta al equipo de desarrollo.

---

## 🎨 Créditos

Creado por **Arturo254** | OpenTune Canvas Studio

---

**Última actualización**: 2026-07-13
