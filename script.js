function shareCard() {
    const shareData = {
        title: 'JS Serralheria',
        text: 'Entre em contato com Josevando Ramos - Metalúrgica e Serralheria.',
        url: 'https://js-serralheria.netlify.app'
    };

    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Compartilhado com sucesso'))
            .catch((error) => console.log('Erro ao compartilhar', error));
    } else {
        navigator.clipboard.writeText('https://js-serralheria.netlify.app');
        alert("Link copiado para a área de transferência!");
    }
}

// --- Galeria Interativa / Catálogo com Carregamento 100% Automático ---
document.addEventListener('DOMContentLoaded', () => {
    const catalogGrid = document.getElementById('catalogGrid');
    const modal = document.getElementById('lightboxModal');
    if (!catalogGrid || !modal) return;

    const FOLDER_PATH = 'images/Catalago/';

    const modalImg = document.getElementById('lightboxImg');
    const modalImgWrapper = document.getElementById('lightboxImgWrapper');
    const modalCounter = document.getElementById('lightboxCounter');
    const modalWhatsapp = document.getElementById('lightboxWhatsapp');
    const shareFileBtn = document.getElementById('lightboxShareFile');
    const copyImgBtn = document.getElementById('lightboxCopyBtn');
    const zoomBtn = document.getElementById('lightboxZoomBtn');
    const modalFavBtn = document.getElementById('lightboxFavBtn');
    const thumbsContainer = document.getElementById('lightboxThumbs');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    // Contadores e Toolbar
    const totalProjectsCount = document.getElementById('totalProjectsCount');
    const allCountBadge = document.getElementById('allCountBadge');
    const filterAllBtn = document.getElementById('filterAllBtn');
    const filterFavBtn = document.getElementById('filterFavBtn');
    const favCountBadge = document.getElementById('favCountBadge');
    const searchInput = document.getElementById('catalogSearch');
    const viewBtns = document.querySelectorAll('.view-btn');
    const emptyCatalogMsg = document.getElementById('emptyCatalogMsg');
    const resetFilterBtn = document.getElementById('resetFilterBtn');

    // Barra Flutuante de Favoritos e Topo
    const floatingFavBar = document.getElementById('floatingFavBar');
    const favBarText = document.getElementById('favBarText');
    const favWhatsappBtn = document.getElementById('favWhatsappBtn');
    const clearFavsBtn = document.getElementById('clearFavsBtn');
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const toastEl = document.getElementById('toastNotification');

    let catalogItems = [];
    const loadedSrcSet = new Set();
    let currentIndex = 0;
    let activeFilter = 'all';
    let searchQuery = '';
    let toastTimer = null;

    // Carrega favoritos salvos no navegador
    let favorites = new Set();
    try {
        const saved = JSON.parse(localStorage.getItem('js_serralheria_favs') || '[]');
        if (Array.isArray(saved)) favorites = new Set(saved);
    } catch (e) {
        favorites = new Set();
    }

    function saveFavorites() {
        try {
            localStorage.setItem('js_serralheria_favs', JSON.stringify([...favorites]));
        } catch (e) {}
    }

    function showToast(message) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3500);
    }

    function getSiteBaseUrl() {
        const isPublicWeb =
            (window.location.protocol === 'https:' || window.location.protocol === 'http:') &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1';
        if (isPublicWeb) {
            const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            return `${window.location.origin}${basePath}`;
        }
        return 'https://js-serralheria.netlify.app/';
    }

    function getWhatsappLinkForImage(imgElement, index) {
        const relativePath = imgElement.getAttribute('src');
        const baseUrl = getSiteBaseUrl();
        const photoNum = String(index + 1).padStart(2, '0');
        const imageUrl = `${baseUrl}${relativePath}`;
        const catalogLink = `${baseUrl}catalogo.html?foto=${index + 1}`;
        const msg = `Olá! Gostaria de solicitar um orçamento deste serviço do catálogo (Projeto #${photoNum}):\n${imageUrl}\nVer no catálogo: ${catalogLink}`;
        return `https://wa.me/556992595342?text=${encodeURIComponent(msg)}`;
    }

    function updateTotalCounters() {
        const total = catalogItems.length;
        if (totalProjectsCount) totalProjectsCount.textContent = total;
        if (allCountBadge) allCountBadge.textContent = total;
        if (modal.classList.contains('active') && modalCounter && total > 0) {
            const photoNum = String(currentIndex + 1).padStart(2, '0');
            modalCounter.textContent = `Projeto #${photoNum} de ${total}`;
        }
    }

    function updateFavoritesUI() {
        const count = favorites.size;
        if (favCountBadge) favCountBadge.textContent = count;

        catalogItems.forEach((img, idx) => {
            const card = img.closest('.catalog-item');
            if (!card) return;
            const favBtn = card.querySelector('.catalog-fav-btn');
            const isFav = favorites.has(idx);
            card.classList.toggle('is-favorite', isFav);
            if (favBtn) {
                favBtn.classList.toggle('active', isFav);
                favBtn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
            }
        });

        if (modalFavBtn) {
            const isCurrentFav = favorites.has(currentIndex);
            modalFavBtn.classList.toggle('fav-active', isCurrentFav);
            modalFavBtn.innerHTML = isCurrentFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        }

        if (floatingFavBar) {
            if (count > 0) {
                floatingFavBar.classList.add('visible');
                favBarText.textContent = count === 1 ? '1 foto selecionada' : `${count} fotos selecionadas`;
                const baseUrl = getSiteBaseUrl();
                const sortedFavs = [...favorites].sort((a, b) => a - b);
                const listLines = sortedFavs.map(i => {
                    const num = String(i + 1).padStart(2, '0');
                    return `• Projeto #${num}: ${baseUrl}catalogo.html?foto=${i + 1}`;
                }).join('\n');
                const multiMsg = `Olá! Selecionei ${count} modelo(s) no catálogo da JS Serralheria e gostaria de um orçamento:\n\n${listLines}`;
                favWhatsappBtn.href = `https://wa.me/556992595342?text=${encodeURIComponent(multiMsg)}`;
            } else {
                floatingFavBar.classList.remove('visible');
            }
        }

        applyFilters();
    }

    function toggleFavorite(index) {
        const num = String(index + 1).padStart(2, '0');
        if (favorites.has(index)) {
            favorites.delete(index);
            showToast(`Projeto #${num} removido dos favoritos`);
        } else {
            favorites.add(index);
            showToast(`❤️ Projeto #${num} salvo nos favoritos!`);
        }
        saveFavorites();
        updateFavoritesUI();
    }

    function applyFilters() {
        let visibleCount = 0;
        const cleanQuery = searchQuery.trim().replace(/^#/, '').toLowerCase();

        catalogItems.forEach((img, index) => {
            const card = img.closest('.catalog-item');
            if (!card) return;
            const numStr = String(index + 1);
            const paddedNum = numStr.padStart(2, '0');

            const matchesFav = activeFilter === 'all' || favorites.has(index);
            const matchesSearch =
                !cleanQuery ||
                numStr.includes(cleanQuery) ||
                paddedNum.includes(cleanQuery) ||
                `projeto ${numStr}`.includes(cleanQuery) ||
                `foto ${numStr}`.includes(cleanQuery);

            if (matchesFav && matchesSearch) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (emptyCatalogMsg && catalogItems.length > 0) {
            emptyCatalogMsg.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    // Copia a imagem real para a área de transferência (Ctrl+V no WhatsApp)
    async function copyImageToClipboard(imgElement) {
        if (!navigator.clipboard || !window.ClipboardItem) return false;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = imgElement.naturalWidth || imgElement.width;
            canvas.height = imgElement.naturalHeight || imgElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, 0, 0);
            const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!pngBlob) return false;
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
            return true;
        } catch (err) {
            return false;
        }
    }

    function setZoom(zoomed) {
        if (!modalImgWrapper || !zoomBtn) return;
        modalImgWrapper.classList.toggle('zoomed', zoomed);
        zoomBtn.innerHTML = zoomed ? '<i class="fas fa-search-minus"></i>' : '<i class="fas fa-search-plus"></i>';
    }

    function updateLightbox(index) {
        const totalImages = catalogItems.length;
        if (totalImages === 0) return;
        currentIndex = (index + totalImages) % totalImages;
        const targetImg = catalogItems[currentIndex];
        const photoNum = String(currentIndex + 1).padStart(2, '0');

        setZoom(false);
        modalImg.src = targetImg.src;
        modalImg.alt = targetImg.alt;
        modalCounter.textContent = `Projeto #${photoNum} de ${totalImages}`;
        modalWhatsapp.href = getWhatsappLinkForImage(targetImg, currentIndex);

        if (modalFavBtn) {
            const isCurrentFav = favorites.has(currentIndex);
            modalFavBtn.classList.toggle('fav-active', isCurrentFav);
            modalFavBtn.innerHTML = isCurrentFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        }

        if (thumbsContainer) {
            const thumbs = thumbsContainer.querySelectorAll('.lightbox-thumb-item');
            thumbs.forEach((t, i) => {
                t.classList.toggle('active', i === currentIndex);
            });
            const activeThumb = thumbs[currentIndex];
            if (activeThumb) {
                activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }

    function openLightbox(index) {
        updateLightbox(index);
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        setZoom(false);
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Cria automaticamente o card da foto dentro de #catalogGrid
    function createCatalogCard(relativeSrc) {
        const key = relativeSrc.toLowerCase();
        if (loadedSrcSet.has(key)) return false;
        loadedSrcSet.add(key);

        const index = catalogItems.length;
        const photoNum = String(index + 1).padStart(2, '0');

        const card = document.createElement('div');
        card.className = 'catalog-item';
        card.style.animationDelay = `${Math.min(index * 20, 350)}ms`;

        const imgBox = document.createElement('div');
        imgBox.className = 'catalog-img-box';

        const img = document.createElement('img');
        img.src = relativeSrc;
        img.alt = `Serviço JS Serralheria ${index + 1}`;
        img.loading = 'lazy';
        catalogItems.push(img);

        const badge = document.createElement('span');
        badge.className = 'catalog-item-number';
        badge.textContent = `#${photoNum}`;

        const favBtn = document.createElement('button');
        favBtn.type = 'button';
        favBtn.className = 'catalog-fav-btn';
        favBtn.title = 'Favoritar este modelo';
        favBtn.innerHTML = '<i class="far fa-heart"></i>';
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(index);
        });

        const zoomHint = document.createElement('div');
        zoomHint.className = 'catalog-zoom-hint';
        zoomHint.innerHTML = '<i class="fas fa-expand-alt"></i>';

        imgBox.appendChild(img);
        imgBox.appendChild(badge);
        imgBox.appendChild(favBtn);
        imgBox.appendChild(zoomHint);
        imgBox.addEventListener('click', () => openLightbox(index));

        const footer = document.createElement('div');
        footer.className = 'catalog-card-footer';

        const waQuickBtn = document.createElement('a');
        waQuickBtn.className = 'catalog-item-wa';
        waQuickBtn.href = getWhatsappLinkForImage(img, index);
        waQuickBtn.target = '_blank';
        waQuickBtn.innerHTML = '<i class="fab fa-whatsapp"></i> <span>Pedir Orçamento</span>';
        waQuickBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const copied = await copyImageToClipboard(img);
            if (copied) {
                showToast(`✅ Foto #${photoNum} copiada! Cole no WhatsApp.`);
            }
        });

        footer.appendChild(waQuickBtn);
        card.appendChild(imgBox);
        card.appendChild(footer);
        catalogGrid.appendChild(card);

        if (thumbsContainer) {
            const thumb = document.createElement('div');
            thumb.className = 'lightbox-thumb-item';
            const thumbImg = document.createElement('img');
            thumbImg.src = relativeSrc;
            thumbImg.alt = `Miniatura ${photoNum}`;
            thumbImg.loading = 'lazy';
            thumb.appendChild(thumbImg);
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                updateLightbox(index);
            });
            thumbsContainer.appendChild(thumb);
        }

        return true;
    }

    // Verifica se um arquivo existe tentando carregá-lo como imagem
    function checkImageExists(src) {
        return new Promise((resolve) => {
            const probe = new Image();
            probe.onload = () => resolve(src);
            probe.onerror = () => resolve(null);
            probe.src = src;
        });
    }

    // Verifica uma numeração específica (ex: foto-01.jpeg, foto-1.jpeg, .jpg, .png)
    async function findPhotoByNumber(num) {
        const padded = String(num).padStart(2, '0');
        const primary = `${FOLDER_PATH}foto-${padded}.jpeg`;
        const existsPrimary = await checkImageExists(primary);
        if (existsPrimary) return existsPrimary;

        const alternatives = [
            `${FOLDER_PATH}foto-${padded}.jpg`,
            `${FOLDER_PATH}foto-${padded}.png`,
            `${FOLDER_PATH}foto-${num}.jpeg`,
            `${FOLDER_PATH}foto-${num}.jpg`
        ];
        for (const alt of alternatives) {
            if (alt === primary) continue;
            const found = await checkImageExists(alt);
            if (found) return found;
        }
        return null;
    }

    // Função principal que busca automaticamente todas as "foto-XX" na pasta images/Catalago/
    async function loadAllNumberedPhotos() {
        const BATCH_SIZE = 20;
        let currentStart = 1;
        let consecutiveMisses = 0;
        const MAX_MISSES = 2;

        while (consecutiveMisses < MAX_MISSES && currentStart <= 500) {
            const nums = [];
            for (let i = 0; i < BATCH_SIZE; i++) {
                nums.push(currentStart + i);
            }

            // Verifica o lote em paralelo para carregar muito rápido
            const results = await Promise.all(nums.map((n) => findPhotoByNumber(n)));

            for (const foundSrc of results) {
                if (foundSrc) {
                    createCatalogCard(foundSrc);
                    consecutiveMisses = 0;
                } else {
                    consecutiveMisses++;
                    if (consecutiveMisses >= MAX_MISSES) break;
                }
            }

            updateTotalCounters();
            updateFavoritesUI();
            currentStart += BATCH_SIZE;
        }

        checkUrlPhotoParam();
    }

    // Eventos de Filtro, Busca e Tamanho da Grade
    if (filterAllBtn && filterFavBtn) {
        filterAllBtn.addEventListener('click', () => {
            activeFilter = 'all';
            filterAllBtn.classList.add('active');
            filterFavBtn.classList.remove('active');
            applyFilters();
        });
        filterFavBtn.addEventListener('click', () => {
            activeFilter = 'favorites';
            filterFavBtn.classList.add('active');
            filterAllBtn.classList.remove('active');
            applyFilters();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applyFilters();
        });
    }

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            activeFilter = 'all';
            searchQuery = '';
            if (searchInput) searchInput.value = '';
            if (filterAllBtn) filterAllBtn.classList.add('active');
            if (filterFavBtn) filterFavBtn.classList.remove('active');
            applyFilters();
        });
    }

    viewBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.getAttribute('data-view');
            catalogGrid.classList.remove('view-large', 'view-compact');
            if (view === 'large') catalogGrid.classList.add('view-large');
            if (view === 'compact') catalogGrid.classList.add('view-compact');
        });
    });

    if (clearFavsBtn) {
        clearFavsBtn.addEventListener('click', () => {
            favorites.clear();
            saveFavorites();
            updateFavoritesUI();
            showToast('Lista de favoritos limpa');
        });
    }

    // Eventos do Lightbox
    if (zoomBtn && modalImgWrapper) {
        zoomBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setZoom(!modalImgWrapper.classList.contains('zoomed'));
        });
        modalImgWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            setZoom(!modalImgWrapper.classList.contains('zoomed'));
        });
    }

    if (modalFavBtn) {
        modalFavBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(currentIndex);
        });
    }

    if (copyImgBtn) {
        copyImgBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const targetImg = catalogItems[currentIndex];
            const copied = await copyImageToClipboard(targetImg);
            const photoNum = String(currentIndex + 1).padStart(2, '0');
            if (copied) {
                showToast(`✅ Imagem #${photoNum} copiada! Basta colar no WhatsApp.`);
            } else {
                showToast('Toque e segure na foto para compartilhar ou copiar.');
            }
        });
    }

    // Compartilhamento nativo de arquivo (Celular)
    if (navigator.canShare && shareFileBtn) {
        shareFileBtn.style.display = 'inline-flex';
        shareFileBtn.addEventListener('click', async () => {
            const targetImg = catalogItems[currentIndex];
            const photoNum = String(currentIndex + 1).padStart(2, '0');
            try {
                const response = await fetch(targetImg.src);
                const blob = await response.blob();
                const file = new File([blob], `servico-foto-${photoNum}.jpg`, { type: 'image/jpeg' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Orçamento - Projeto #${photoNum}`,
                        text: `Olá! Gostaria de solicitar um orçamento deste serviço (Projeto #${photoNum}) da JS Serralheria.`
                    });
                }
            } catch (err) {
                console.log('Compartilhamento cancelado', err);
            }
        });
    }

    modalWhatsapp.addEventListener('click', async () => {
        const targetImg = catalogItems[currentIndex];
        const copied = await copyImageToClipboard(targetImg);
        const photoNum = String(currentIndex + 1).padStart(2, '0');
        if (copied) {
            showToast(`✅ Foto #${photoNum} copiada! Cole na conversa do WhatsApp.`);
        }
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateLightbox(currentIndex - 1);
    });
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateLightbox(currentIndex + 1);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeLightbox();
        }
    });

    // Suporte a Swipe (arrastar pro lado no celular) no Lightbox
    let touchStartX = 0;
    modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
        const diff = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diff) > 45) {
            if (diff < 0) updateLightbox(currentIndex + 1);
            else updateLightbox(currentIndex - 1);
        }
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') updateLightbox(currentIndex - 1);
        if (e.key === 'ArrowRight') updateLightbox(currentIndex + 1);
    });

    // Botão Voltar ao Topo
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            scrollTopBtn.classList.toggle('visible', window.scrollY > 350);
        });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function checkUrlPhotoParam() {
        const params = new URLSearchParams(window.location.search);
        const fotoParam = parseInt(params.get('foto'), 10);
        if (!isNaN(fotoParam) && fotoParam >= 1 && fotoParam <= catalogItems.length && !modal.classList.contains('active')) {
            openLightbox(fotoParam - 1);
        }
    }

    // Inicia o carregamento automático de todas as fotos numeradas (foto-01, foto-02...)
    loadAllNumberedPhotos();
});
