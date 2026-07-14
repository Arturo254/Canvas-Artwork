(function() {
    'use strict';

    // ============================================================
    // DOM References
    // ============================================================
    const $ = (id) => document.getElementById(id);

    const apiBaseInput = $('apiBase');
    const tokenInput = $('uploadToken');
    const connStatus = $('connStatus');
    const settingsPanel = $('settingsPanel');
    const settingsToggle = $('settingsToggle');
    const saveSettingsBtn = $('saveSettings');
    const testConnBtn = $('testConn');
    const testResult = $('testResult');

    const dropzone = $('dropzone');
    const fileInput = $('fileInput');
    const uploadBtn = $('uploadBtn');

    const fArtist = $('fArtist');
    const fAlbum = $('fAlbum');
    const fSong = $('fSong');

    const progressWrap = $('progressWrap');
    const progressFill = $('progressFill');
    const progressLabel = $('progressLabel');

    const searchInput = $('searchInput');
    const refreshBtn = $('refreshBtn');
    const galleryContainer = $('galleryContainer');
    const totalCount = $('totalCount');
    const skeletonGrid = $('skeletonGrid');

    const snackbar = $('snackbar');
    const snackbarText = $('snackbarText');

    const modalBackdrop = $('modalBackdrop');
    const modalVideo = $('modalVideo');
    const modalClose = $('modalClose');
    const modalArtist = $('modalArtist');
    const modalMeta = $('modalMeta');
    const modalAlbum = $('modalAlbum');
    const modalOpenUrl = $('modalOpenUrl');
    const modalCopyUrl = $('modalCopyUrl');

    const closeWarningBtn = $('closeWarning');
    const devWarning = $('devWarning');
    const footerTimestamp = $('footerTimestamp');

    // ============================================================
    // Store (localStorage)
    // ============================================================
    const store = {
        get apiBase() { return localStorage.getItem('ot_api_base') || ''; },
        set apiBase(v) { localStorage.setItem('ot_api_base', v); },
        get token() { return localStorage.getItem('ot_upload_token') || ''; },
        set token(v) { localStorage.setItem('ot_upload_token', v); },
        get warningHidden() { return localStorage.getItem('ot_warning_hidden') === 'true'; },
        set warningHidden(v) { localStorage.setItem('ot_warning_hidden', v); }
    };

    // ============================================================
    // Utility Functions
    // ============================================================
    function normalizedBase() {
        return store.apiBase.trim().replace(/\/+$/, '');
    }

    function escapeHtml(s) {
        return (s || '').replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m]);
    }

    function humanSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function emptyStateHtml(title, sub) {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="5" width="15" height="14" rx="2"/>
                    <path d="M23 7l-7 5 7 5V7z"/>
                </svg>
                <h4>${escapeHtml(title)}</h4>
                <p>${escapeHtml(sub)}</p>
            </div>
        `;
    }

    function skeletons(n) {
        return Array.from({ length: n }).map(() => '<div class="skeleton"></div>').join('');
    }

    // ============================================================
    // Footer Timestamp
    // ============================================================
    function updateFooterTimestamp() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        if (footerTimestamp) {
            footerTimestamp.textContent = `Última actualización: ${dateStr} · ${timeStr}`;
        }
    }
    updateFooterTimestamp();

    // ============================================================
    // Snackbar
    // ============================================================
    let snackTimer = null;

    function showSnackbar(text, isError) {
        const el = snackbar;
        snackbarText.textContent = text;
        el.classList.toggle('error', !!isError);
        el.classList.add('show');
        clearTimeout(snackTimer);
        const duration = Math.min(7000, Math.max(3200, text.length * 60));
        snackTimer = setTimeout(() => el.classList.remove('show'), duration);
    }

    // ============================================================
    // Connection Status
    // ============================================================
    function refreshConnStatus() {
        const configured = !!normalizedBase() && !!store.token;
        connStatus.textContent = configured ? '✅ Conectado' : '🔴 Sin configurar';
        connStatus.classList.toggle('ok', configured);
        return configured;
    }

    // ============================================================
    // Developer Warning
    // ============================================================
    function initWarning() {
        if (store.warningHidden) {
            devWarning.style.display = 'none';
        }

        closeWarningBtn.addEventListener('click', () => {
            devWarning.style.display = 'none';
            store.warningHidden = true;
        });
    }

    // ============================================================
    // Settings Panel
    // ============================================================
    apiBaseInput.value = store.apiBase;
    tokenInput.value = store.token;
    refreshConnStatus();

    if (!refreshConnStatus()) {
        settingsPanel.classList.add('open');
    }

    settingsToggle.addEventListener('click', () => {
        settingsPanel.classList.toggle('open');
    });

    saveSettingsBtn.addEventListener('click', () => {
        store.apiBase = apiBaseInput.value.trim();
        store.token = tokenInput.value.trim();
        const ok = refreshConnStatus();
        showSnackbar(ok ? '✅ Conexión guardada correctamente' : '⚠️ Completá URL y token', !ok);
        if (ok) {
            settingsPanel.classList.remove('open');
            loadCatalog();
        }
    });

    // ============================================================
    // Test Connection
    // ============================================================
    testConnBtn.addEventListener('click', async () => {
        const base = apiBaseInput.value.trim().replace(/\/+$/, '');
        testResult.style.color = 'var(--md-on-surface-variant)';
        testResult.textContent = '⏳ Probando conexión...';

        if (!base) {
            testResult.style.color = 'var(--md-error)';
            testResult.textContent = '⚠️ Ingresá primero la URL del Worker.';
            return;
        }

        if (!/^https?:\/\//i.test(base)) {
            testResult.style.color = 'var(--md-error)';
            testResult.textContent = '⚠️ La URL debe empezar con https:// (o http:// solo en local).';
            return;
        }

        try {
            const startedAt = performance.now();
            const res = await fetch(`${base}/?action=list`, { method: 'GET' });
            const elapsed = Math.round(performance.now() - startedAt);
            const text = await res.text();

            let parsed = null;
            try { parsed = JSON.parse(text); } catch (_) {}

            if (!parsed) {
                testResult.style.color = 'var(--md-error)';
                testResult.textContent =
                    `⚠️ El servidor respondió (HTTP ${res.status}) pero no es JSON válido.\n` +
                    `Esto normalmente significa que el Worker no está desplegado en esa URL, ` +
                    `o que hay un error interno.\nPrimeros caracteres:\n${text.slice(0, 180)}`;
                return;
            }

            if (!parsed.success) {
                testResult.style.color = 'var(--md-error)';
                testResult.textContent = `⚠️ El servidor respondió pero con error: ${parsed.message || 'sin mensaje'}`;
                return;
            }

            const n = parsed?.data?.canvases?.length ?? 0;
            const sampleUrl = parsed?.data?.canvases?.[0]?.url || '(catálogo vacío)';
            const badUrl = sampleUrl.startsWith('undefined');

            testResult.style.color = badUrl ? 'var(--md-error)' : '#B8FBAF';
            testResult.textContent =
                `✅ Conectado en ${elapsed} ms · ${n} canvas(es) en el catálogo.\n` +
                `📹 URL de ejemplo: ${sampleUrl}` +
                (badUrl ? '\n⚠️ Empieza con "undefined": falta configurar PUBLIC_CDN_BASE en el Worker.' : '');
        } catch (err) {
            testResult.style.color = 'var(--md-error)';
            const isCors = err instanceof TypeError;
            testResult.textContent = isCors ?
                '⚠️ Fetch bloqueado (Failed to fetch). Causas más comunes:\n' +
                '  · La URL está mal escrita o el Worker no está desplegado.\n' +
                '  · Falta el manejo de OPTIONS/CORS en el Worker (redeployá la versión corregida).\n' +
                '  · Estás abriendo este HTML desde file:// y el navegador lo bloquea — probá subirlo a un hosting o Cloudflare Pages.' :
                `⚠️ Error inesperado: ${err.message || err}`;
        }
    });

    // ============================================================
    // Dropzone
    // ============================================================
    let selectedFile = null;

    function setFile(file) {
        if (!file) return;
        if (!file.type.includes('video')) {
            showSnackbar('⚠️ Elegí un archivo de video (MP4)', true);
            return;
        }
        selectedFile = file;
        const url = URL.createObjectURL(file);
        dropzone.classList.add('has-file');
        dropzone.innerHTML = `
            <div class="preview-wrap">
                <video src="${url}" autoplay muted loop playsinline></video>
                <button class="preview-remove" id="removeFileBtn" type="button" aria-label="Quitar archivo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                        <path d="M18 6L6 18"/>
                        <path d="M6 6l12 12"/>
                    </svg>
                </button>
                <div class="preview-meta">📹 ${escapeHtml(file.name)} · ${humanSize(file.size)}</div>
            </div>
        `;
        document.getElementById('removeFileBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            clearFile();
        });
        validateForm();
    }

    function clearFile() {
        selectedFile = null;
        fileInput.value = '';
        dropzone.classList.remove('has-file', 'drag');
        dropzone.innerHTML = `
            <div id="dzEmpty">
                <div class="dz-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 7l-7 5 7 5V7z"/>
                        <rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                </div>
                <div class="dz-title">📹 Arrastrá tu video acá</div>
                <div class="dz-sub">o hacé clic para seleccionarlo · MP4 · Formato vertical (9:16)</div>
            </div>
        `;
        validateForm();
    }

    dropzone.addEventListener('click', (e) => {
        if (!dropzone.classList.contains('has-file')) fileInput.click();
    });

    fileInput.addEventListener('change', (e) => setFile(e.target.files[0]));

    ['dragenter', 'dragover'].forEach((evt) =>
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzone.classList.add('drag');
        })
    );

    ['dragleave', 'drop'].forEach((evt) =>
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag');
        })
    );

    dropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        setFile(file);
    });

    // ============================================================
    // Form Validation
    // ============================================================
    function validateForm() {
        uploadBtn.disabled = !(selectedFile && fArtist.value.trim());
    }

    [fArtist, fAlbum, fSong].forEach((el) => el.addEventListener('input', validateForm));

    // ============================================================
    // Upload
    // ============================================================
    uploadBtn.addEventListener('click', () => {
        const base = normalizedBase();
        if (!base || !store.token) {
            showSnackbar('⚠️ Configurá la conexión al servidor primero', true);
            settingsPanel.classList.add('open');
            return;
        }

        if (!selectedFile || !fArtist.value.trim()) return;

        const form = new FormData();
        form.append('artist', fArtist.value.trim());
        form.append('album', fAlbum.value.trim());
        form.append('song', fSong.value.trim());
        form.append('file', selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${base}/?action=upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${store.token}`);

        uploadBtn.disabled = true;
        progressWrap.classList.add('show');
        progressFill.style.width = '0%';
        progressLabel.textContent = '⏳ Subiendo… 0%';

        xhr.upload.addEventListener('progress', (e) => {
            if (!e.lengthComputable) return;
            const pct = Math.round((e.loaded / e.total) * 100);
            progressFill.style.width = pct + '%';
            progressLabel.textContent = `⏳ Subiendo… ${pct}%`;
        });

        xhr.onload = () => {
            progressWrap.classList.remove('show');
            let ok = false,
                msg = null;
            try {
                const res = JSON.parse(xhr.responseText);
                ok = res.success;
                msg = res.message || null;
            } catch (_) {
                msg = `El servidor respondió HTTP ${xhr.status} sin JSON válido (¿Worker caído o URL incorrecta?)`;
            }

            if (xhr.status === 200 && ok) {
                showSnackbar('✅ Canvas subido correctamente a OpenTune 🎉');
                fArtist.value = '';
                fAlbum.value = '';
                fSong.value = '';
                clearFile();
                loadCatalog();
            } else if (xhr.status === 401) {
                showSnackbar('🔒 Token de subida incorrecto (revisá UPLOAD_TOKEN)', true);
            } else if (xhr.status === 0) {
                showSnackbar('🚫 Bloqueado por CORS o sin conexión — probá "Probar conexión" en Configuración', true);
            } else {
                showSnackbar(msg || `Error subiendo el canvas (HTTP ${xhr.status})`, true);
            }
            validateForm();
        };

        xhr.onerror = () => {
            progressWrap.classList.remove('show');
            showSnackbar('🚫 No se pudo conectar (CORS, red, o URL del Worker incorrecta)', true);
            validateForm();
        };

        xhr.send(form);
    });

    // ============================================================
    // Catalog
    // ============================================================
    let allCanvases = [];

    skeletonGrid.innerHTML = skeletons(8);

    async function loadCatalog() {
        const base = normalizedBase();
        if (!base) {
            galleryContainer.innerHTML = emptyStateHtml(
                '🔌 Configurá la conexión',
                'Ingresá la URL del Worker para ver el catálogo de canvases de OpenTune.'
            );
            totalCount.textContent = '—';
            return;
        }

        galleryContainer.innerHTML = `<div class="grid">${skeletons(8)}</div>`;

        try {
            const res = await fetch(`${base}/?action=list`);
            const data = await res.json();

            if (!data.success) throw new Error(data.message || 'Respuesta inválida');

            allCanvases = data.data.canvases || [];
            renderGallery(allCanvases);
        } catch (err) {
            galleryContainer.innerHTML = emptyStateHtml(
                '❌ No se pudo cargar el catálogo',
                err.message || 'Revisá la URL del Worker y tu conexión.'
            );
            totalCount.textContent = '—';
        }
    }

    function renderGallery(list) {
        const count = list.length;
        totalCount.textContent = `${count} canvas${count === 1 ? '' : 'es'}`;

        if (count === 0) {
            galleryContainer.innerHTML = emptyStateHtml(
                '📭 Sin resultados',
                'Probá con otro artista o álbum, o subí el primer canvas a OpenTune.'
            );
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'grid';

        list.forEach((c) => {
            const card = document.createElement('div');
            card.className = 'card';
            const label = c.song && c.song.trim() ? c.song : (c.album || 'Álbum completo');
            card.innerHTML = `
                <div class="card-media">
                    <span class="badge-album">${c.song && c.song.trim() ? '🎵 Canción' : '💿 Álbum'}</span>
                    <video src="${escapeHtml(c.url)}" muted loop playsinline preload="metadata"></video>
                    <div class="play-hint">
                        <svg viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-artist">${escapeHtml(c.artist)}</p>
                    <p class="card-sub">${escapeHtml(label)}</p>
                </div>
            `;

            const video = card.querySelector('video');
            card.addEventListener('mouseenter', () => video.play().catch(() => {}));
            card.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
            card.addEventListener('click', () => openModal(c));
            grid.appendChild(card);
        });

        galleryContainer.innerHTML = '';
        galleryContainer.appendChild(grid);
    }

    searchInput.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (!q) {
            renderGallery(allCanvases);
            return;
        }
        const filtered = allCanvases.filter((c) =>
            (c.artist || '').toLowerCase().includes(q) ||
            (c.album || '').toLowerCase().includes(q) ||
            (c.song || '').toLowerCase().includes(q)
        );
        renderGallery(filtered);
    });

    refreshBtn.addEventListener('click', loadCatalog);

    // ============================================================
    // Modal
    // ============================================================
    function openModal(c) {
        modalVideo.src = c.url;
        modalArtist.textContent = c.artist;
        const metaParts = [];
        if (c.album) metaParts.push(`💿 ${c.album}`);
        if (c.song) metaParts.push(`🎵 ${c.song}`);
        modalMeta.textContent = metaParts.join(' · ') || 'Sin canción específica';
        modalAlbum.textContent = c.song ? `Álbum: ${c.album || 'Sin álbum'}` : 'Aplica a todo el álbum';
        modalOpenUrl.href = c.url;
        modalBackdrop.classList.add('show');
        modalVideo.play().catch(() => {});

        modalCopyUrl.onclick = () => {
            navigator.clipboard.writeText(c.url).then(() => showSnackbar('📋 URL copiada al portapapeles'));
        };
    }

    function closeModal() {
        modalBackdrop.classList.remove('show');
        modalVideo.pause();
        modalVideo.src = '';
    }

    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // ============================================================
    // Init
    // ============================================================
    initWarning();

    if (normalizedBase()) {
        loadCatalog();
    } else {
        skeletonGrid.parentElement.innerHTML = emptyStateHtml(
            '🔌 Configurá la conexión',
            'Ingresá la URL del Worker y el token para empezar a gestionar los canvases de OpenTune.'
        );
    }

    // ============================================================
    // Keyboard shortcut: Ctrl+Shift+D to toggle developer warning
    // ============================================================
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            if (devWarning.style.display === 'none') {
                devWarning.style.display = 'flex';
                store.warningHidden = false;
            } else {
                devWarning.style.display = 'none';
                store.warningHidden = true;
            }
        }
    });

    // ============================================================
    // Auto-refresh catalog every 60 seconds
    // ============================================================
    if (normalizedBase()) {
        setInterval(() => {
            loadCatalog();
            updateFooterTimestamp();
        }, 60000);
    }

})();