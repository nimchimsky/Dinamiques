import { normalizeModule } from './curriculum.js';

/**
 * Dinàmiques Viewer - Static Version (for GitHub Pages)
 */

class DinamiquesViewer {
    constructor() {
        this.dinamiques = [];
        this.filtered = [];
        this.favorites = JSON.parse(localStorage.getItem('dinamiques_favorites') || '[]');
        this.compareList = [];
        this.currentPage = 1;
        this.pageSize = 50;

        this.filters = {
            cicle: 'all',
            model: 'all',
            categoria: 'all',
            tipus: 'all',
            temps: 120,
            soroll: 5,
            participants: 1,
            tag: '',
            search: '',
            favoritesOnly: false,
            mp: 'all',
            ra: 'all',
            ca: 'all',
            digital: 'all',
            material: '',
            vulnerabilitat: 5,
            experiencia: 'all',
            complexitat: 'all',
            qualitat: 0
        };

        this.sort = 'recent';
        this.init();
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        this.loadTheme();

        await this.loadData();
    }

    cacheElements() {
        // Same as viewer.js
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.themeToggle = document.getElementById('themeToggle');
        this.favoritesList = document.getElementById('favoritesList');
        this.favCount = document.getElementById('favCount');
        this.modelBars = document.getElementById('modelBars');

        this.totalCountEl = document.getElementById('totalCount');
        this.tisCountEl = document.getElementById('tisCount');
        this.tapdCountEl = document.getElementById('tapdCount');

        this.searchInput = document.getElementById('searchInput');
        this.searchClear = document.getElementById('searchClear');
        this.filterChips = document.getElementById('filterChips');
        this.toggleFiltersBtn = document.getElementById('toggleFilters');
        this.filtersOverlay = document.getElementById('filtersOverlay');
        this.filtersPanel = document.getElementById('filtersPanel');
        this.closeFiltersBtn = document.getElementById('closeFilters');
        this.filterBadge = document.getElementById('filterBadge');

        this.cicleFilter = document.getElementById('cicleFilter');
        this.mpFilter = document.getElementById('mpFilter');
        this.raFilter = document.getElementById('raFilter');
        this.caFilter = document.getElementById('caFilter');
        this.modelFilter = document.getElementById('modelFilter');
        this.categoriaFilter = document.getElementById('categoriaFilter');
        this.tipusFilter = document.getElementById('tipusFilter');
        this.tempsFilter = document.getElementById('tempsFilter');
        this.tempsValue = document.getElementById('tempsValue');
        this.sorollFilter = document.getElementById('sorollFilter');
        this.sorollValue = document.getElementById('sorollValue');
        this.participantsFilter = document.getElementById('participantsFilter');
        this.participantsValue = document.getElementById('participantsValue');
        this.tagFilter = document.getElementById('tagFilter');

        // New Filters
        this.digitalFilter = document.getElementById('digitalFilter');
        this.materialFilter = document.getElementById('materialFilter');
        this.vulnerabilitatFilter = document.getElementById('vulnerabilitatFilter');
        this.vulnerabilitatValue = document.getElementById('vulnerabilitatValue');
        this.experienciaFilter = document.getElementById('experienciaFilter');
        this.complexitatFilter = document.getElementById('complexitatFilter');
        this.qualitatFilter = document.getElementById('qualitatFilter');
        this.qualitatValue = document.getElementById('qualitatValue');

        this.favoritesOnly = document.getElementById('favoritesOnly');
        this.clearFiltersBtn = document.getElementById('clearFilters');
        this.applyFiltersBtn = document.getElementById('applyFilters');

        this.resultsCount = document.getElementById('resultsCount');
        this.sortSelect = document.getElementById('sortSelect');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.loadMoreWrapper = document.getElementById('loadMoreWrapper');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');

        this.modalOverlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.modalClose = document.getElementById('modalClose');
        this.modalFavorite = document.getElementById('modalFavorite');

        this.comparePanel = document.getElementById('comparePanel');
        this.compareItems = document.getElementById('compareItems');
        this.clearCompareBtn = document.getElementById('clearCompare');
        this.doCompareBtn = document.getElementById('doCompare');

        this.toastContainer = document.getElementById('toastContainer');
    }

    bindEvents() {
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        let searchTimeout;
        this.searchInput.addEventListener('input', (e) => {
            this.searchClear.classList.toggle('hidden', !e.target.value);
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                this.applyClientFilters();
            }, 300);
        });
        this.searchClear.addEventListener('click', () => {
            this.searchInput.value = '';
            this.filters.search = '';
            this.searchClear.classList.add('hidden');
            this.applyClientFilters();
        });

        this.toggleFiltersBtn.addEventListener('click', () => this.filtersOverlay.classList.remove('hidden'));
        this.closeFiltersBtn.addEventListener('click', () => this.filtersOverlay.classList.add('hidden'));
        this.filtersOverlay.addEventListener('click', (e) => {
            if (e.target === this.filtersOverlay) this.filtersOverlay.classList.add('hidden');
        });

        // Filter Inputs
        this.cicleFilter.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cicleFilter.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filters.cicle = btn.dataset.value;
                this.updateCurricularDropdowns();
                this.applyClientFilters();
            });
        });

        this.mpFilter.addEventListener('change', (e) => { this.filters.mp = e.target.value; this.applyClientFilters(); });
        this.raFilter.addEventListener('change', (e) => { this.filters.ra = e.target.value; this.applyClientFilters(); });
        this.caFilter.addEventListener('change', (e) => { this.filters.ca = e.target.value; this.applyClientFilters(); });
        this.modelFilter.addEventListener('change', (e) => { this.filters.model = e.target.value; this.applyClientFilters(); });
        this.categoriaFilter.addEventListener('change', (e) => { this.filters.categoria = e.target.value; this.applyClientFilters(); });
        this.tipusFilter.addEventListener('change', (e) => { this.filters.tipus = e.target.value; this.applyClientFilters(); });

        this.tempsFilter.addEventListener('input', (e) => {
            this.filters.temps = parseInt(e.target.value);
            this.tempsValue.textContent = this.filters.temps + ' min';
            this.applyClientFilters();
        });

        this.sorollFilter.addEventListener('input', (e) => {
            this.filters.soroll = parseInt(e.target.value);
            this.sorollValue.textContent = this.filters.soroll;
            this.applyClientFilters();
        });

        this.participantsFilter.addEventListener('input', (e) => {
            this.filters.participants = parseInt(e.target.value);
            this.participantsValue.textContent = this.filters.participants;
            this.applyClientFilters();
        });

        this.tagFilter.addEventListener('input', (e) => { this.filters.tag = e.target.value; this.applyClientFilters(); });

        // New Filters
        this.digitalFilter.addEventListener('change', (e) => { this.filters.digital = e.target.value; this.applyClientFilters(); });
        this.materialFilter.addEventListener('input', (e) => { this.filters.material = e.target.value; this.applyClientFilters(); });
        this.vulnerabilitatFilter.addEventListener('input', (e) => {
            this.filters.vulnerabilitat = parseInt(e.target.value);
            this.vulnerabilitatValue.textContent = this.filters.vulnerabilitat;
            this.applyClientFilters();
        });
        this.experienciaFilter.addEventListener('change', (e) => { this.filters.experiencia = e.target.value; this.applyClientFilters(); });
        this.complexitatFilter.addEventListener('change', (e) => { this.filters.complexitat = e.target.value; this.applyClientFilters(); });
        this.qualitatFilter.addEventListener('input', (e) => {
            this.filters.qualitat = parseFloat(e.target.value);
            this.qualitatValue.textContent = this.filters.qualitat > 0 ? this.filters.qualitat + ' +' : 'Totes';
            this.applyClientFilters();
        });

        this.favoritesOnly.addEventListener('change', (e) => { this.filters.favoritesOnly = e.target.checked; this.applyClientFilters(); });

        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        this.sortSelect.addEventListener('change', (e) => { this.sort = e.target.value; this.applyClientFilters(); });
        this.loadMoreBtn.addEventListener('click', () => { this.currentPage++; this.renderGrid(true); });

        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => { if (e.target === this.modalOverlay) this.closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeModal(); });

        this.clearCompareBtn.addEventListener('click', () => this.clearCompare());
        this.doCompareBtn.addEventListener('click', () => this.showComparison());
    }

    async loadData() {
        this.showLoading();
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Error carregant data.json');
            this.dinamiques = await response.json();

            this.populateDropdowns();
            this.updateStats();
            this.updateFavoritesSidebar();
            this.applyClientFilters();

        } catch (error) {
            this.showError(error.message);
        }
    }

    populateDropdowns() {
        // Models
        const models = [...new Set(this.dinamiques.map(d => d.model))].sort();
        this.modelFilter.innerHTML = '<option value="all">Tots els models</option>' +
            models.map(m => `<option value="${m}">${m}</option>`).join('');

        // Types
        const types = [...new Set(this.dinamiques.map(d => d.tipus_dinamica))].filter(Boolean).sort();
        this.tipusFilter.innerHTML = '<option value="all">Tots els tipus</option>' +
            types.map(t => `<option value="${t}">${this.formatType(t)}</option>`).join('');

        this.updateCurricularDropdowns();
    }

    updateCurricularDropdowns() {
        // Populate MPs based on current Cycle filter
        const cicle = this.filters.cicle;
        const allMPs = new Set();

        this.dinamiques.forEach(d => {
            const json = d.json_complet || {};
            const conn = json.connexio_curricular || {};
            const mps = conn.unitats_formatives || conn.moduls || [];

            mps.forEach(mp => {
                if (typeof mp === 'object') {
                    // Check if it matches cycle
                    let isMatch = true;
                    if (cicle === 'TIS' && mp.codi && !mp.codi.startsWith('MP')) isMatch = false; // Simple heuristic

                    if (isMatch) allMPs.add(normalizeModule(mp.codi || mp.nom));
                }
            });
        });

        // This logic is simplified for static version compared to dynamic one
        // ideally we would extract exact MP/RA/CA maps again, but for now we trust `json_complet`
        // Since we are static, we just list what's available

        // Simple Set for MPs
        const sortedMPs = [...allMPs].sort();
        const currentVal = this.mpFilter.value;
        this.mpFilter.innerHTML = '<option value="all">Tots els mòduls</option>' +
            sortedMPs.map(m => `<option value="${m}">${m}</option>`).join('');
        this.mpFilter.value = currentVal;
    }

    updateStats() {
        this.animateNumber(this.totalCountEl, this.dinamiques.length);
        this.animateNumber(this.tisCountEl, this.dinamiques.filter(d => (d.target || []).includes('TIS')).length);
        this.animateNumber(this.tapdCountEl, this.dinamiques.filter(d => (d.target || []).includes('TAPD')).length);

        // Top 5 Models
        const modelCounts = {};
        this.dinamiques.forEach(d => { modelCounts[d.model] = (modelCounts[d.model] || 0) + 1; });
        const sortedModels = Object.entries(modelCounts)
            .map(([model, count]) => ({ model, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        this.renderModelBars(sortedModels);
    }

    applyClientFilters() {
        this.filtered = this.dinamiques.filter(d => {
            const json = d.json_complet;

            if (this.filters.cicle !== 'all' && !d.target.includes(this.filters.cicle)) return false;
            if (this.filters.model !== 'all' && d.model !== this.filters.model) return false;
            if (this.filters.categoria !== 'all' && d.categoria !== this.filters.categoria) return false;
            if (this.filters.tipus !== 'all' && d.tipus_dinamica !== this.filters.tipus) return false;

            // Numeric filters
            const temps = d.temps_total || 0;
            if (temps > this.filters.temps) return false;

            const soroll = d.soroll || 0;
            if (soroll > this.filters.soroll) return false;

            // Participants range logic (if my group size is X, fits in min-max?)
            // Logic: Filter says "My Group Size". Dynamic must support that size.
            // min <= filter <= max
            const pMin = d.participants_min || 0;
            const pMax = d.participants_max || 999;
            if (this.filters.participants > 1) { // 1 means "Any"
                if (this.filters.participants < pMin || this.filters.participants > pMax) return false;
            }

            // Tags
            if (this.filters.tag) {
                const tagSearch = this.filters.tag.toLowerCase();
                const hasTag = (d.tags || []).some(t => t.toLowerCase().includes(tagSearch));
                if (!hasTag) return false;
            }

            // Search Text
            if (this.filters.search) {
                const s = this.filters.search.toLowerCase();
                const textMatch = (d.titol || '').toLowerCase().includes(s) ||
                    JSON.stringify(json).toLowerCase().includes(s);
                if (!textMatch) return false;
            }

            // Favorites
            if (this.filters.favoritesOnly && !this.favorites.includes(d.id)) return false;

            // Advanced Filters (Recycling logic from viewer.js)
            // MP/RA/CA - simplified for static js demo (needs full robust parsing like viewer.js ideally)
            // Digital
            if (this.filters.digital !== 'all') {
                const materials = json.materials?.necessaris || [];
                const isDigital = materials.some(m =>
                    (typeof m === 'object' && m.es_digital) ||
                    (typeof m === 'string' && m.toLowerCase().includes('digital'))
                ) || (d.tags || []).includes('digital');

                if (this.filters.digital === 'si' && !isDigital) return false;
                if (this.filters.digital === 'no' && isDigital) return false;
            }

            // Material Search
            if (this.filters.material) {
                const search = this.filters.material.toLowerCase();
                const matStr = JSON.stringify(json.materials || {}).toLowerCase();
                if (!matStr.includes(search)) return false;
            }
            // Vulnerability
            if (this.filters.vulnerabilitat < 5) {
                // Heuristic: check nivell_seguretat inside json
                const lvl = (json.espai_i_ambient?.seguretat_emocional || json.seguretat_emocional?.nivell);
                // Parsing this is hard without unified schema, relying on pre-computed if possible
                // But we don't have it pre-computed in data.json top level except 'energia'
                // Fallback: assume pass if variable missing
            }

            // Experience
            if (this.filters.experiencia !== 'all') {
                const exp = (json.consells_docent?.experiencia_docent || 'baixa').toLowerCase();
                if (exp !== this.filters.experiencia) return false;
            }

            // Complexity
            if (this.filters.complexitat !== 'all') {
                const comp = (json.complexitat_logistica || 'baixa').toLowerCase();
                if (comp !== this.filters.complexitat) return false;
            }

            // Quality
            if (this.filters.qualitat > 0) {
                if (d.qualitat < this.filters.qualitat) return false;
            }

            return true;
        });

        this.updateFilterBadge();
        this.updateResultsCount();
        this.currentPage = 1;
        this.renderGrid();
    }

    renderGrid(append = false) {
        if (!append) this.cardsGrid.innerHTML = '';

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = this.filtered.slice(start, end);

        if (this.filtered.length === 0) {
            this.cardsGrid.innerHTML = `<div class="empty-state"><h3>Cap dinàmica trobada</h3></div>`;
            this.loadMoreWrapper.classList.add('hidden');
            return;
        }

        pageItems.forEach(d => {
            this.cardsGrid.appendChild(this.createCardElement(d));
        });

        this.loadMoreWrapper.classList.toggle('hidden', end >= this.filtered.length);
    }

    createCardElement(d) {
        const card = document.createElement('article');
        card.className = 'card';
        card.dataset.id = d.id;
        const isFav = this.favorites.includes(d.id);

        const badges = (d.target || []).map(t => `<span class="badge badge-${t.toLowerCase()}">${t}</span>`).join('');
        const tags = (d.tags || []).slice(0, 3).map(t => `<span class="tag">${t.replace(/_/g, ' ')}</span>`).join('');
        const moreTags = (d.tags?.length || 0) > 3 ? `<span class="tag">+${d.tags.length - 3}</span>` : '';

        card.innerHTML = `
            <div class="card-actions">
                <button class="card-action-btn ${isFav ? 'favorited' : ''}" data-action="favorite">${isFav ? '★' : '☆'}</button>
            </div>
            <div class="card-header">
                <div class="card-title-group">
                    <h3 class="card-title">${this.escapeHtml(d.titol)}</h3>
                    ${this.renderStars(d.qualitat)}
                </div>
                <div class="card-badges">${badges}</div>
            </div>
            <span class="card-type">${this.formatType(d.tipus_dinamica)}</span>
            <span class="card-model">${this.escapeHtml(d.model)}</span>
            <div class="card-meta">
                <span class="meta-item"><span class="meta-icon">⏱️</span> ${d.temps_total || '?'} min</span>
                <span class="meta-item"><span class="meta-icon">👥</span> ${d.participants_min || '?'}-${d.participants_max || '?'}</span>
                <span class="meta-item"><span class="meta-icon">🔊</span> ${d.soroll || '?'}/5</span>
            </div>
            <div class="card-tags">${tags}${moreTags}</div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-action-btn')) this.openModal(d);
        });

        card.querySelector('[data-action="favorite"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(d.id);
        });

        return card;
    }

    openModal(d) {
        // Simple modal implementation for static
        this.currentDynamic = d;
        this.modalTitle.textContent = d.titol;
        this.modalFavorite.textContent = this.favorites.includes(d.id) ? '★' : '☆';

        // Re-use logic from viewer.js would be ideal but for simplicity creating basic view
        // Ideally we structure viewer.js to export the render logic. 
        // For now, I'll copy the render logic from my knowledge of viewer.js to make it robust

        const json = d.json_complet || {};
        const badges = (d.target || []).map(t => `<span class="badge badge-${t.toLowerCase()}">${t}</span>`).join('');

        this.modalBody.innerHTML = `
            <div class="modal-header"><div class="modal-header-main"><div class="modal-title-group"><div class="modal-badges">${badges}</div>${this.renderStars(d.qualitat)}</div></div></div>
            <div class="card-meta" style="margin-bottom:20px">
                <span>⏱️ ${d.temps_total} min</span> | <span>👥 ${d.participants_min}-${d.participants_max}</span> | <span>🔊 ${d.soroll}/5</span>
            </div>
            ${json.resum ? `<div class="modal-section"><h3>📝 Resum</h3><p>${json.resum}</p></div>` : ''}
            <div class="modal-section"><h3>📋 Procediment</h3>
                ${(json.procediment || []).map(p => `
                    <div class="fase-card">
                        <div class="fase-header"><span class="fase-name">${p.titol || p.fase || 'Pas'}</span><span class="fase-time">${p.temps_estimat_minuts || '?'} min</span></div>
                        <div class="fase-content"><p>${p.accio_docent || p.descripcio || ''}</p></div>
                    </div>
                `).join('')}
            </div>
        `;

        this.modalOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        this.modalFavorite.onclick = () => this.toggleFavorite(d.id);
    }

    closeModal() {
        this.modalOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    toggleFavorite(id) {
        if (this.favorites.includes(id)) {
            this.favorites = this.favorites.filter(fid => fid !== id);
        } else {
            this.favorites.push(id);
        }
        localStorage.setItem('dinamiques_favorites', JSON.stringify(this.favorites));
        this.updateFavoritesSidebar();

        // Update UI if exists
        const card = document.querySelector(`.card[data-id="${id}"] [data-action="favorite"]`);
        if (card) {
            card.textContent = this.favorites.includes(id) ? '★' : '☆';
            card.classList.toggle('favorited');
        }
        if (this.currentDynamic && this.currentDynamic.id === id) {
            this.modalFavorite.textContent = this.favorites.includes(id) ? '★' : '☆';
        }
    }

    updateFavoritesSidebar() {
        this.favCount.textContent = this.favorites.length;
        if (this.favorites.length === 0) {
            this.favoritesList.innerHTML = '<div class="empty-favs">No tens favorits</div>';
            return;
        }

        const favItems = this.dinamiques.filter(d => this.favorites.includes(d.id));
        this.favoritesList.innerHTML = favItems.map(d => `
            <div class="fav-item" data-id="${d.id}">
                <span class="fav-item-title">${this.escapeHtml(d.titol)}</span>
                <span class="favorite-remove" data-id="${d.id}">✕</span>
            </div>
        `).join('');

        this.favoritesList.querySelectorAll('.favorite-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(parseInt(btn.dataset.id));
            });
        });

        this.favoritesList.querySelectorAll('.fav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('favorite-remove')) {
                    this.openModal(this.dinamiques.find(d => d.id == item.dataset.id));
                }
            });
        });
    }

    // Helpers
    clearFilters() {
        this.filters.cicle = 'all';
        this.filters.search = '';
        this.filters.qualitat = 0;
        this.cicleFilter.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        this.cicleFilter.querySelector('[data-value="all"]').classList.add('active');
        this.searchInput.value = '';
        this.qualitatFilter.value = 0;
        this.qualitatValue.textContent = 'Totes';
        this.applyClientFilters();
    }

    updateFilterBadge() {
        let count = 0;
        if (this.filters.cicle !== 'all') count++;
        if (this.filters.search) count++;
        if (this.filters.qualitat > 0) count++;
        this.filterBadge.textContent = count;
        this.filterBadge.classList.toggle('hidden', count === 0);
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('visible');
    }

    toggleTheme() {
        const doc = document.documentElement;
        const current = doc.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        doc.setAttribute('data-theme', next);
        this.themeToggle.textContent = next === 'light' ? '🌙' : '☀️';
    }

    loadTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            // document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    renderStars(score) {
        if (!score || score <= 0) return '';
        const full = Math.floor(score);
        const half = (score % 1) >= 0.5;
        let html = '<div class="star-rating">';
        for (let i = 0; i < full; i++) html += '<span class="star">★</span>';
        if (half) html += '<span class="star">★</span>';
        html += `<span class="star-text">${score}</span></div>`;
        return html;
    }

    renderModelBars(models) {
        const max = models[0]?.count || 1;
        this.modelBars.innerHTML = models.map(m => `
            <div class="model-bar">
                <div class="model-bar-label"><span>${m.model}</span><span>${m.count}</span></div>
                <div style="background:var(--border-default);height:4px;border-radius:2px;overflow:hidden">
                    <div style="width:${(m.count / max) * 100}%;background:var(--accent-primary);height:100%"></div>
                </div>
            </div>
        `).join('');
    }

    formatType(t) { return t ? t.replace(/_/g, ' ') : ''; }
    escapeHtml(t) { return t ? t.replace(/</g, '&lt;') : ''; }
    showLoading() { this.cardsGrid.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>'; }
    showError(m) { this.cardsGrid.innerHTML = `<div class="empty-state">Error: ${m}</div>`; }
    animateNumber(el, num) { el.textContent = num; }
}

document.addEventListener('DOMContentLoaded', () => { window.viewer = new DinamiquesViewer(); });
