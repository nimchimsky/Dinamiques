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
        this.applyFiltersBtn.addEventListener('click', () => this.filtersOverlay.classList.add('hidden'));

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

    updateStats() {
        this.animateNumber(this.totalCountEl, this.dinamiques.length);
        this.animateNumber(this.tisCountEl, this.dinamiques.filter(d => (d.target || []).includes('TIS')).length);
        this.animateNumber(this.tapdCountEl, this.dinamiques.filter(d => (d.target || []).includes('TAPD')).length);

        // Calculate Module Stats from the loaded dynamics
        const moduleCounts = {};
        this.dinamiques.forEach(d => {
            const conn = d.json_complet?.connexio_curricular || d.connexio_curricular || {};
            const units = conn.unitats_formatives || conn.moduls || [];

            const processMP = (code, name) => {
                const norm = normalizeModule(code, name);
                const label = norm ? norm.label : (code || name);
                if (label) {
                    moduleCounts[label] = (moduleCounts[label] || 0) + 1;
                }
            };

            if (units.length > 0) {
                units.forEach(u => processMP(u.codi, u.nom));
            } else {
                processMP(conn.modul_codi, conn.modul);
            }
        });

        const sortedModules = Object.entries(moduleCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        this.renderModuleBars(sortedModules);
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
        const cicle = this.filters.cicle;
        const mps = new Set();
        const ras = new Set();
        const cas = new Set();

        this.dinamiques.forEach(d => {
            if (cicle !== 'all' && !d.target.includes(cicle)) return;

            const json = d.json_complet || {};
            const conn = json.connexio_curricular || {};

            // Nested structure support
            const units = conn.unitats_formatives || conn.moduls || [];

            if (units.length > 0) {
                units.forEach(u => {
                    const code = u.codi || u.nom || '';
                    let isMatch = true;
                    if (cicle === 'TIS' && code && !code.startsWith('MP')) isMatch = false;

                    if (isMatch) {
                        const normalized = normalizeModule(u.codi, u.nom);
                        const mpLabel = normalized ? normalized.label : (u.codi || u.nom);
                        mps.add(mpLabel);

                        if (this.filters.mp === 'all' || this.filters.mp === mpLabel) {
                            (u.resultats_aprenentatge || []).forEach(r => {
                                const raName = r.codi || r.descripcio; // e.g. "RA1"
                                if (raName) {
                                    ras.add(raName);

                                    if (this.filters.ra === 'all' || this.filters.ra === raName) {
                                        (r.criteris_avaluacio || []).forEach(c => cas.add(c));
                                    }
                                }
                            });
                        }
                    }
                });
            } else {
                // Flat structure fallback
                const rawCode = (conn.modul_codi || '').trim();
                const rawName = (conn.modul || '').trim();
                if (!rawCode && !rawName) return;

                let normalized = normalizeModule(rawCode, rawName);
                if (normalized.cycle === '?' && d.target && d.target.length === 1) {
                    const inferredCycle = d.target[0].toUpperCase();
                    normalized = {
                        ...normalized,
                        cycle: inferredCycle,
                        label: `${rawCode || normalized.code} - ${rawName || normalized.name} [${inferredCycle}]`
                    };
                }

                const mpLabel = normalized.label;
                mps.add(mpLabel);

                if (this.filters.mp === 'all' || this.filters.mp === mpLabel) {
                    const raName = (conn.ra || '').toUpperCase().trim();
                    if (raName) {
                        ras.add(raName);
                        if (this.filters.ra === 'all' || this.filters.ra === raName) {
                            let cas_list = Array.isArray(conn.ca) ? conn.ca : (conn.ca ? [conn.ca] : []);
                            cas_list.forEach(c => cas.add(String(c).toUpperCase().trim()));
                        }
                    }
                }
            }
        });

        // Update MP Dropdown
        const currentMp = this.mpFilter.value;
        this.mpFilter.innerHTML = '<option value="all">Tots els mòduls</option>' +
            [...mps].sort().map(m => `<option value="${m}">${m}</option>`).join('');
        if ([...mps].includes(currentMp)) this.mpFilter.value = currentMp;

        // Update RA Dropdown
        const currentRa = this.raFilter.value;
        this.raFilter.innerHTML = '<option value="all">Tots els RAs</option>' +
            [...ras].sort().map(r => `<option value="${r}">${r}</option>`).join('');
        if ([...ras].includes(currentRa)) this.raFilter.value = currentRa;

        // Update CA Dropdown
        const currentCa = this.caFilter.value;
        this.caFilter.innerHTML = '<option value="all">Tots els CAs</option>' +
            [...cas].sort().map(c => `<option value="${c}">${c}</option>`).join('');
        if ([...cas].includes(currentCa)) this.caFilter.value = currentCa;
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

            // Advanced Filters
            if (this.filters.mp !== 'all' || this.filters.ra !== 'all' || this.filters.ca !== 'all') {
                const json = d.json_complet || {};
                const conn = json.connexio_curricular || {};
                const units = conn.unitats_formatives || conn.moduls || [];

                let matchesMP = (this.filters.mp === 'all');
                let matchesRA = (this.filters.ra === 'all');
                let matchesCA = (this.filters.ca === 'all');

                if (units.length > 0) {
                    // Nested structure logic
                    if (!matchesMP) {
                        matchesMP = units.some(u => {
                            const norm = normalizeModule(u.codi, u.nom);
                            return (norm ? norm.label : (u.codi || u.nom)) === this.filters.mp;
                        });
                    }
                    if (this.filters.ra !== 'all') {
                        matchesRA = units.some(u => {
                            const norm = normalizeModule(u.codi, u.nom);
                            const mpLabel = norm ? norm.label : (u.codi || u.nom);
                            if (this.filters.mp !== 'all' && mpLabel !== this.filters.mp) return false;
                            return (u.resultats_aprenentatge || []).some(r => (r.codi || r.descripcio) === this.filters.ra);
                        });
                    }
                    if (this.filters.ca !== 'all') {
                        matchesCA = units.some(u => {
                            const norm = normalizeModule(u.codi, u.nom);
                            const mpLabel = norm ? norm.label : (u.codi || u.nom);
                            if (this.filters.mp !== 'all' && mpLabel !== this.filters.mp) return false;
                            return (u.resultats_aprenentatge || []).some(r => {
                                if (this.filters.ra !== 'all' && (r.codi || r.descripcio) !== this.filters.ra) return false;
                                return (r.criteris_avaluacio || []).includes(this.filters.ca);
                            });
                        });
                    }
                } else {
                    // Flat structure logic
                    const rawCode = (conn.modul_codi || '').trim();
                    const rawName = (conn.modul || '').trim();
                    let normalized = normalizeModule(rawCode, rawName);

                    if (normalized) {
                        if (normalized.cycle === '?' && d.target && d.target.length === 1) {
                            const inferredCycle = d.target[0].toUpperCase();
                            normalized = { ...normalized, label: `${rawCode || normalized.code} - ${rawName || normalized.name} [${inferredCycle}]` };
                        }

                        if (!matchesMP) matchesMP = (normalized.label === this.filters.mp);

                        if (this.filters.ra !== 'all') {
                            if (this.filters.mp !== 'all' && normalized.label !== this.filters.mp) matchesRA = false;
                            else matchesRA = (String(conn.ra || '').toUpperCase().trim() === this.filters.ra);
                        }

                        if (this.filters.ca !== 'all') {
                            if (this.filters.mp !== 'all' && normalized.label !== this.filters.mp) matchesCA = false;
                            else if (this.filters.ra !== 'all' && String(conn.ra || '').toUpperCase().trim() !== this.filters.ra) matchesCA = false;
                            else {
                                let cas_list = Array.isArray(conn.ca) ? conn.ca : (conn.ca ? [conn.ca] : []);
                                matchesCA = cas_list.some(c => String(c).toUpperCase().trim() === this.filters.ca);
                            }
                        }
                    } else {
                        matchesMP = matchesRA = matchesCA = false;
                    }
                }

                if (!matchesMP || !matchesRA || !matchesCA) return false;
            }
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
                // Normalize 10-scale score to 5-scale for filtering
                const normalizedScore = (d.qualitat || 0) / 2;
                if (normalizedScore < this.filters.qualitat) return false;
            }

            return true;
        });

        // Apply Sorting
        if (this.sort) {
            this.filtered.sort((a, b) => {
                switch (this.sort) {
                    case 'recent':
                        return (b.id || 0) - (a.id || 0); // Assuming higher ID is newer
                    case 'stars-desc':
                        return (b.qualitat || 0) - (a.qualitat || 0);
                    case 'stars-asc':
                        return (a.qualitat || 0) - (b.qualitat || 0);
                    case 'title':
                        return (a.titol || '').localeCompare(b.titol || '');
                    case 'time-asc':
                        return (a.temps_total || 999) - (b.temps_total || 999);
                    case 'time-desc':
                        return (b.temps_total || 0) - (a.temps_total || 0);
                    case 'participants-asc':
                        return (a.participants_min || 0) - (b.participants_min || 0);
                    default:
                        return 0;
                }
            });
        }

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
                <h3 class="card-title">${this.escapeHtml(d.titol)}</h3>
                <div class="card-badges">${badges}</div>
            </div>
            <div class="card-tags-row">
                <span class="card-type">${this.formatType(d.tipus_dinamica)}</span>
                <span class="card-model">${this.escapeHtml(d.model)}</span>
                ${this.renderStars(d.qualitat)}
            </div>
            <div class="card-meta">
                <div class="meta-item"><span class="meta-icon">⏱️</span> ${d.temps_total || '?'} min</div>
                <div class="meta-item"><span class="meta-icon">👥</span> ${d.participants_min || '?'}-${d.participants_max || '?'}</div>
                <div class="meta-item"><span class="meta-icon">🔊</span> ${d.soroll || '?'}/5</div>
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
        this.currentDynamic = d;
        this.modalTitle.textContent = d.titol;
        this.modalFavorite.textContent = this.favorites.includes(d.id) ? '★' : '☆';
        this.modalFavorite.classList.toggle('favorited', this.favorites.includes(d.id));

        const json = d.json_complet || {};
        const badges = (d.target || []).map(t => `<span class="badge badge-${t.toLowerCase()}">${t}</span>`).join('');

        this.modalBody.innerHTML = `
            <div class="modal-meta">
                ${badges}
                <span class="card-type">${this.formatType(d.tipus_dinamica)}</span>
                <span class="card-model">${this.escapeHtml(d.model)}</span>
            </div>
            
            <div style="margin-bottom: 24px;">
                ${this.renderStars(d.qualitat)}
            </div>

            <div class="info-block">
                <div class="info-row"><span class="info-label">Durada</span><span class="info-value">${d.temps_total || '?'} minuts</span></div>
                <div class="info-row"><span class="info-label">Participants</span><span class="info-value">${d.participants_min || '?'}-${d.participants_max || '?'}</span></div>
                <div class="info-row"><span class="info-label">Nivell de soroll</span><span class="info-value">${d.soroll || '?'}/5</span></div>
                <div class="info-row"><span class="info-label">Categoria</span><span class="info-value">${d.categoria || '?'}</span></div>
            </div>

            ${json.resum ? `
                <div class="modal-section">
                    <h3 class="modal-section-title">📝 Resum</h3>
                    <p>${json.resum}</p>
                </div>
            ` : ''}

            ${json.objectiu ? `
                <div class="modal-section">
                    <h3 class="modal-section-title">🎯 Objectiu</h3>
                    <p>${json.objectiu}</p>
                </div>
            ` : ''}

            ${json.procediment ? `
                <div class="modal-section">
                    <h3 class="modal-section-title">📋 Procediment</h3>
                    <ul>
                        ${(json.procediment || []).map(p => `
                            <li><strong>${p.titol || p.fase || 'Pas'}:</strong> ${p.accio_docent || p.descripcio || ''}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${d.merged_variants && d.merged_variants.length > 0 ? `
                <div class="modal-section" style="background:var(--bg-secondary); padding:12px; border-radius:8px; margin-top:20px;">
                    <h3 class="modal-section-title">🔀 Variants Fusionades</h3>
                    <p style="font-size:0.9em; opacity:0.8; margin-bottom:8px">Aquesta fitxa inclou continguts de les següents dinàmiques similars:</p>
                    <ul style="margin:0; padding-left:20px; font-size:0.9em;">
                        ${d.merged_variants.map(v => `
                            <li><strong>${this.escapeHtml(v.titol)}</strong> <span style="opacity:0.6">(ID: ${v.id})</span></li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${this.renderMaterials(json.materials)}
            ${this.renderTeacherTips(json.consells_docent)}
            ${this.renderAccessibility(json.adaptacions_accessibilitat)}
            ${this.renderCurricularConnection(json.connexio_curricular)}
            ${this.renderEvaluation(json.avaluacio)}
            ${this.renderDebrief(json.tancament_i_reflexio)}
            ${this.renderInternalVariants(json.variants)}
        `;

        this.modalOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
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

    updateResultsCount() {
        const showing = Math.min(this.currentPage * this.pageSize, this.filtered.length);
        this.resultsCount.textContent = `Mostrant ${showing} de ${this.filtered.length} dinàmiques`;
    }

    loadTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            // document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    renderStars(score) {
        if (!score || score <= 0) return '';
        // Normalize 10-scale to 5-scale
        const normalized = score > 5 ? score / 2 : score;
        const full = Math.floor(normalized);
        const half = (normalized % 1) >= 0.5;

        let html = '<div class="star-rating">';
        for (let i = 0; i < full; i++) html += '<span class="star">★</span>';
        if (half) html += '<span class="star" style="opacity:0.7">★</span>';
        html += `<span class="star-text">${score}</span></div>`;
        return html;
    }

    renderMaterials(mat) {
        if (!mat) return '';
        if (typeof mat === 'string') {
            return `<div class="modal-section"><h3 class="modal-section-title">📦 Materials</h3><p>${mat}</p></div>`;
        }

        let html = '<div class="modal-section"><h3 class="modal-section-title">📦 Materials</h3>';

        if (mat.necessaris && mat.necessaris.length > 0) {
            html += '<p><strong>Necessaris:</strong></p><ul>';
            mat.necessaris.forEach(m => {
                const text = typeof m === 'object' ? (m.item || m.nom || JSON.stringify(m)) : m;
                html += `<li>${text}</li>`;
            });
            html += '</ul>';
        }

        if (mat.opcionals && mat.opcionals.length > 0) {
            html += '<p><strong>Opcionals:</strong></p><ul>';
            mat.opcionals.forEach(m => html += `<li>${m}</li>`);
            html += '</ul>';
        }

        if (mat.dossier_alumne || mat.targetes_de_rol) {
            html += '<p><em>(Veure annexos / fitxes de rol)</em></p>';
        }

        html += '</div>';
        return html;
    }

    renderTeacherTips(tips) {
        if (!tips) return '';
        if (typeof tips === 'string') return `<div class="modal-section"><h3 class="modal-section-title">💡 Consells Docent</h3><p>${tips}</p></div>`;

        let html = '<div class="modal-section"><h3 class="modal-section-title">💡 Consells Docent</h3>';

        if (tips.advertencies && tips.advertencies.length) {
            html += '<div class="tip-box warning"><strong>⚠️ Atenció:</strong><ul>' +
                tips.advertencies.map(t => `<li>${t}</li>`).join('') + '</ul></div>';
        }

        if (tips.errors_comuns && tips.errors_comuns.length) {
            html += '<div class="tip-box info"><strong>🚫 Errors Comuns:</strong><ul>' +
                tips.errors_comuns.map(t => `<li>${t}</li>`).join('') + '</ul></div>';
        }

        // Generic text keys
        ['preparacio_aula', 'gestio_temps', 'recomanacions'].forEach(k => {
            if (tips[k]) html += `<p><strong>${this.formatType(k)}:</strong> ${tips[k]}</p>`;
        });

        html += '</div>';
        return html;
    }

    renderAccessibility(acc) {
        if (!acc) return '';
        let html = '<div class="modal-section"><h3 class="modal-section-title">♿ Accessibilitat</h3><ul>';
        let hasContent = false;

        Object.keys(acc).forEach(k => {
            const val = acc[k];
            if (val && val !== 'cap' && val !== 'res') {
                hasContent = true;
                html += `<li><strong>${this.formatType(k)}:</strong> ${val}</li>`;
            }
        });

        html += '</ul></div>';
        return hasContent ? html : '';
    }
    renderCurricularConnection(conn) {
        if (!conn) return '';
        let html = '<div class="modal-section"><h3 class="modal-section-title">🎓 Connexió Curricular</h3><div class="info-block">';

        if (conn.modul_codi || conn.modul) {
            html += `<div class="info-row"><span class="info-label">Mòdul</span><span class="info-value">${conn.modul_codi || ''} ${conn.modul || ''}</span></div>`;
        }
        if (conn.ra) {
            html += `<div class="info-row"><span class="info-label">RA</span><span class="info-value">${conn.ra}</span></div>`;
        }
        html += '</div>';

        if (conn.descriptors) html += `<p style="margin-top:8px"><strong>Descriptors:</strong> ${conn.descriptors}</p>`;

        html += '</div>';
        return (conn.modul || conn.modul_codi) ? html : '';
    }

    renderEvaluation(ev) {
        if (!ev) return '';
        let html = '<div class="modal-section"><h3 class="modal-section-title">📊 Avaluació</h3>';

        if (ev.que_observar && ev.que_observar.length) {
            html += '<p><strong>Què observar:</strong></p><ul>' + ev.que_observar.map(o => `<li>${o}</li>`).join('') + '</ul>';
        }

        if (ev.evidencies_aprenentatge && ev.evidencies_aprenentatge.length) {
            html += '<p><strong>Evidències:</strong></p><ul>' + ev.evidencies_aprenentatge.map(e => `<li>${e}</li>`).join('') + '</ul>';
        }

        if (ev.indicadors_nivell) {
            html += '<div class="tip-box info"><strong>Nivells:</strong><br/>';
            Object.keys(ev.indicadors_nivell).forEach(k => {
                html += `<strong>${k}:</strong> ${ev.indicadors_nivell[k]}<br/>`;
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    renderDebrief(deb) {
        if (!deb) return '';
        let html = '<div class="modal-section"><h3 class="modal-section-title">🗣️ Tancament i Reflexió</h3>';

        if (deb.element_disparador) html += `<p><strong>Disparador:</strong> ${deb.element_disparador}</p>`;

        if (deb.preguntes_debrief && deb.preguntes_debrief.length) {
            html += '<p><strong>Preguntes Clau:</strong></p><ul>' + deb.preguntes_debrief.map(q => `<li>${q}</li>`).join('') + '</ul>';
        }

        if (deb.punts_clau_destacar && deb.punts_clau_destacar.length) {
            html += '<p><strong>Punts a Destacar:</strong></p><ul>' + deb.punts_clau_destacar.map(p => `<li>${p}</li>`).join('') + '</ul>';
        }

        if (deb.connexio_teoria) html += `<div class="tip-box warning"><strong>🔗 Teoria:</strong> ${deb.connexio_teoria}</div>`;

        html += '</div>';
        return html;
    }

    renderInternalVariants(vars) {
        if (!vars) return '';
        let html = '<div class="modal-section"><h3 class="modal-section-title">🔄 Adaptacions del Model</h3><ul>';
        let hasContent = false;
        Object.keys(vars).forEach(k => {
            const val = vars[k];
            if (val && val !== 'cap' && val !== 'online') { // Online handled separately or included if desired
                hasContent = true;
                html += `<li><strong>${this.formatType(k)}:</strong> ${val}</li>`;
            }
        });
        html += '</ul></div>';
        return hasContent ? html : '';
    }

    renderModuleBars(modules) {
        if (!modules || modules.length === 0) {
            this.modelBars.innerHTML = '<p class="empty-favorites">No hi ha mòduls per mostrar</p>';
            return;
        }
        const max = modules[0]?.count || 1;
        this.modelBars.innerHTML = modules.map(m => `
            <div class="model-bar" onclick="window.viewer.filterByModule('${this.escapeHtml(m.name)}')">
                <div class="model-bar-label">
                    <span class="model-bar-name" title="${this.escapeHtml(m.name)}">${m.name}</span>
                    <span class="model-bar-count">${m.count}</span>
                </div>
                <div class="model-bar-track">
                    <div class="model-bar-fill" style="width:${(m.count / max) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }

    filterByModule(moduleLabel) {
        // Set filter
        this.filters.mp = moduleLabel;

        // Update select UI
        if (this.mpFilter) {
            this.mpFilter.value = moduleLabel;
        }

        // Open filters panel if it was closed or hidden, but maybe just applying is enough
        // Trigger load/filter
        this.loadData();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Show chip or feedback
        this.showToast(`Filtrant per: ${moduleLabel}`);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        this.toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatType(t) { return t ? t.replace(/_/g, ' ') : ''; }
    escapeHtml(t) { return t ? t.replace(/</g, '&lt;') : ''; }
    showLoading() { this.cardsGrid.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>'; }
    showError(m) { this.cardsGrid.innerHTML = `<div class="empty-state">Error: ${m}</div>`; }
    animateNumber(el, num) { el.textContent = num; }
}

document.addEventListener('DOMContentLoaded', () => { window.viewer = new DinamiquesViewer(); });
