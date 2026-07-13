# Canvas-Artwork 🎨

**Canvas for OpenTune** — Una plataforma web para crear, subir y gestionar videos animados con Canvas, diseñada para integración con la aplicación OpenTune.

---

## 📋 Descripción

Canvas-Artwork es una **Web API** que permite:

- ✏️ **Crear animaciones** usando Canvas HTML5
- 📹 **Generar videos** a partir de renderizados canvas
- ☁️ **Subir y gestionar** videos animados en la nube
- 🔌 **Comunicarse** de forma fluida con la aplicación OpenTune
- 🎬 **Reproducir** contenido multimedia interactivo

Es la solución perfecta para artistas y desarrolladores que desean automatizar la creación de contenido visual animado directamente desde Canvas.

---

## 🚀 Características Principales

### 1. API REST Completa
- Endpoints para gestión de animaciones y videos
- Autenticación y autorización segura
- Respuestas en JSON

### 2. Renderizado Canvas
- Soporte para animaciones 2D y 3D
- Exportación de frames a video
- Optimización de rendimiento

### 3. Gestión de Archivos
- Upload de videos animados
- Almacenamiento en la nube
- Versionado de contenido

### 4. Integración OpenTune
- Comunicación bidireccional con la app
- Webhooks para notificaciones
- Sistema de callbacks

---

## 🛠 Stack Tecnológico

- **Frontend**: HTML5, CSS3 (31.1%), JavaScript (44.4%)
- **Backend**: Node.js / Express (API)
- **Canvas**: HTML5 Canvas API para renderizado
- **Video**: FFmpeg o similar para conversión
- **Almacenamiento**: Cloud Storage

---

## 📦 Instalación

### Requisitos Previos
- Node.js v14+
- npm o yarn
- Docker (opcional)

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/Arturo254/Canvas-Artwork.git
cd Canvas-Artwork

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor
npm start
```

---

## 🎯 Uso Rápido

### Crear una Animación Canvas

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Animación de ejemplo
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#3498db';
  ctx.fillRect(10, 10, 100, 100);
  requestAnimationFrame(animate);
}

animate();
```

### Subir Video a través de la API

```javascript
async function uploadVideo(videoFile) {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('title', 'Mi Animación');
  
  const response = await fetch('/api/videos/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}
```

---

## 📡 API Endpoints

### Videos
- `GET /api/videos` — Listar videos
- `POST /api/videos/upload` — Subir nuevo video
- `GET /api/videos/:id` — Obtener detalles
- `DELETE /api/videos/:id` — Eliminar video

### Animaciones
- `POST /api/animations/render` — Renderizar canvas a video
- `GET /api/animations/:id` — Obtener animación
- `PUT /api/animations/:id` — Actualizar animación

### Integración OpenTune
- `POST /api/opentune/sync` — Sincronizar con OpenTune
- `GET /api/opentune/status` — Estado de conexión

---

## 🔐 Autenticación

Utiliza **JWT (JSON Web Tokens)** para autenticación:

```javascript
// Header requerido en todas las peticiones
Authorization: Bearer {token}
```

---

## 📚 Documentación Completa

Para documentación detallada sobre endpoints, modelos de datos y ejemplos, consulta:
- [API Documentation](./docs/API.md)
- [Canvas Guide](./docs/CANVAS.md)
- [OpenTune Integration](./docs/OPENTUNE.md)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT — ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 💬 Soporte

¿Preguntas o problemas? Abre un [issue](https://github.com/Arturo254/Canvas-Artwork/issues) o contacta al equipo de desarrollo.

---

## 🎨 Créditos

Creado por **Arturo254** | Canvas for OpenTune

---

**Última actualización**: 2026-07-13
