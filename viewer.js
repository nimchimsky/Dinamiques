import { normalizeModule } from './curriculum.js';

/**
 * Dinàmiques Viewer - Main Application
 * Premium web interface for visualizing dynamics database
 */

class DinamiquesViewer {
    constructor() {
        // State
        this.dinamiques = [];
        this.filtered = [];
        this.favorites = JSON.parse(localStorage.getItem('dinamiques_favorites') || '[]');
        this.compareList = [];
        this.currentPage = 1;
        this.pageSize = 50;
        this.totalCount = 0;

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
        this.viewMode = 'grid';
        this.mobileBreakpoint = 1024;

        this.init();
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        this.loadTheme();

        await Promise.all([
            this.loadModels(),
            this.loadTipus(),
            this.loadStats()
        ]);

        await this.loadData();
        this.updateFavoritesSidebar();
    }

    cacheElements() {
        // Sidebar
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.themeToggle = document.getElementById('themeToggle');
        this.favoritesList = document.getElementById('favoritesList');
        this.favCount = document.getElementById('favCount');
        this.modelBars = document.getElementById('modelBars');

        // Stats
        this.totalCountEl = document.getElementById('totalCount');
        this.tisCountEl = document.getElementById('tisCount');
        this.tapdCountEl = document.getElementById('tapdCount');

        // Search & Filters
        this.searchInput = document.getElementById('searchInput');
        this.searchClear = document.getElementById('searchClear');
        this.filterChips = document.getElementById('filterChips');
        this.toggleFiltersBtn = document.getElementById('toggleFilters');
        this.filtersOverlay = document.getElementById('filtersOverlay');
        this.filtersPanel = document.getElementById('filtersPanel');
        this.closeFiltersBtn = document.getElementById('closeFilters');
        this.filterBadge = document.getElementById('filterBadge');

        // Filter controls
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

        // Results
        this.resultsCount = document.getElementById('resultsCount');
        this.sortSelect = document.getElementById('sortSelect');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.loadMoreWrapper = document.getElementById('loadMoreWrapper');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');

        // View toggle
        this.viewBtns = document.querySelectorAll('.view-btn');

        // Modal
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.modalClose = document.getElementById('modalClose');
        this.modalFavorite = document.getElementById('modalFavorite');
        this.modalCopy = document.getElementById('modalCopy');

        // Compare
        this.comparePanel = document.getElementById('comparePanel');
        this.compareItems = document.getElementById('compareItems');
        this.clearCompareBtn = document.getElementById('clearCompare');
        this.doCompareBtn = document.getElementById('doCompare');

        // Toast
        this.toastContainer = document.getElementById('toastContainer');
    }

    bindEvents() {
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());

        // Close mobile sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.isMobileViewport()) return;
            if (!this.sidebar.classList.contains('open')) return;

            const clickedInsideSidebar = this.sidebar.contains(e.target);
            const clickedToggle = this.sidebarToggle.contains(e.target);

            if (!clickedInsideSidebar && !clickedToggle) {
                this.closeSidebar();
            }
        });

        // Keep body/UI state in sync on viewport changes
        window.addEventListener('resize', () => {
            if (!this.isMobileViewport()) {
                this.closeSidebar();
            }
        });

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Search
        let searchTimeout;
        this.searchInput.addEventListener('input', (e) => {
            this.searchClear.classList.toggle('hidden', !e.target.value);
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                this.loadData();
            }, 350);
        });

        this.searchClear.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchClear.classList.add('hidden');
            this.filters.search = '';
            this.loadData();
        });

        // Filters drawer toggle
        this.toggleFiltersBtn.addEventListener('click', () => {
            this.filtersOverlay.classList.remove('hidden');
        });

        this.closeFiltersBtn.addEventListener('click', () => {
            this.filtersOverlay.classList.add('hidden');
        });

        this.filtersOverlay.addEventListener('click', (e) => {
            if (e.target === this.filtersOverlay) {
                this.filtersOverlay.classList.add('hidden');
            }
        });

        // Cicle toggle buttons
        this.cicleFilter.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.cicleFilter.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filters.cicle = e.target.dataset.value;
                this.updateCurricularDropdowns(); // Update MPs based on cycle
            });
        });

        // Curricular Filters
        this.mpFilter.addEventListener('change', (e) => {
            this.filters.mp = e.target.value;
            this.updateCurricularDropdowns(true); // Cascade update
        });
        this.raFilter.addEventListener('change', (e) => {
            this.filters.ra = e.target.value;
        });
        this.caFilter.addEventListener('change', (e) => {
            this.filters.ca = e.target.value;
        });
        this.complexitatFilter.addEventListener('change', (e) => {
            this.filters.complexitat = e.target.value;
        });

        this.qualitatFilter.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.qualitatValue.textContent = val === 0 ? 'Totes' : `${val} +`;
            this.filters.qualitat = val;
        });

        // Range sliders
        this.tempsFilter.addEventListener('input', (e) => {
            this.filters.temps = parseInt(e.target.value);
            this.tempsValue.textContent = `${e.target.value} min`;
        });

        this.sorollFilter.addEventListener('input', (e) => {
            this.filters.soroll = parseInt(e.target.value);
            this.sorollValue.textContent = e.target.value;
        });

        // Tag filter
        this.tagFilter.addEventListener('input', (e) => {
            this.filters.tag = e.target.value.toLowerCase().trim();
        });

        this.participantsFilter.addEventListener('input', (e) => {
            this.filters.participants = parseInt(e.target.value);
            this.participantsValue.textContent = e.target.value == 1 ? 'Tots' : e.target.value;
        });

        // Favorites only toggle
        this.favoritesOnly.addEventListener('change', (e) => {
            this.filters.favoritesOnly = e.target.checked;
        });

        // Filter actions
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        this.applyFiltersBtn.addEventListener('click', () => {
            this.filters.model = this.modelFilter.value;
            this.filters.categoria = this.categoriaFilter.value;
            this.filters.tipus = this.tipusFilter.value;
            // Curricular filters are applied client-side typically, but if we loaded new data they persist
            this.loadData();
            this.filtersOverlay.classList.add('hidden');
        });

        // Sort
        this.sortSelect.addEventListener('change', (e) => {
            this.sort = e.target.value;
            this.sortAndRender();
        });

        // View toggle
        this.viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.viewBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.viewMode = e.target.dataset.view;
                this.cardsGrid.classList.toggle('list-view', this.viewMode === 'list');
            });
        });

        // Load more
        this.loadMoreBtn.addEventListener('click', () => this.loadMore());

        // Modal
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });
        this.modalClose.addEventListener('click', () => this.closeModal());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.sidebar.classList.contains('open')) {
                this.closeSidebar();
            }
            if (e.key === 'Escape') this.closeModal();
        });

        this.modalCopy.addEventListener('click', () => this.copyCurrentDynamic());

        // Compare
        this.clearCompareBtn.addEventListener('click', () => this.clearCompare());
        this.doCompareBtn.addEventListener('click', () => this.showComparison());
    }

    // ==================== Theme ====================

    loadTheme() {
        const saved = localStorage.getItem('dinamiques_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('dinamiques_theme', next);
    }

    toggleSidebar() {
        const isOpening = !this.sidebar.classList.contains('open');

        if (isOpening) {
            this.sidebar.classList.add('open');
            if (this.isMobileViewport()) {
                document.body.classList.add('sidebar-open');
            }
            return;
        }

        this.closeSidebar();
    }

    closeSidebar() {
        this.sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
    }

    isMobileViewport() {
        return window.innerWidth <= this.mobileBreakpoint;
    }

    // ==================== API Calls ====================

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();

            this.animateNumber(this.totalCountEl, stats.total);

            // Calculate TIS/TAPD counts (approximate based on target)
            // For now, use total/2 as placeholder - would need API enhancement
            this.animateNumber(this.tisCountEl, Math.floor(stats.total * 0.5));
            this.animateNumber(this.tapdCountEl, Math.floor(stats.total * 0.5));

            // Render model bars
            this.renderModelBars(stats.per_model);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadModels() {
        try {
            const response = await fetch('/api/models');
            const models = await response.json();

            models.forEach(m => {
                const option = document.createElement('option');
                option.value = m.name;
                option.textContent = `${m.name} (${m.count})`;
                this.modelFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading models:', error);
        }
    }

    async loadTipus() {
        try {
            const response = await fetch('/api/tipus');
            const tipus = await response.json();

            tipus.forEach(t => {
                const option = document.createElement('option');
                option.value = t.name;
                option.textContent = `${this.formatType(t.name)} (${t.count})`;
                this.tipusFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading tipus:', error);
        }
    }

    // ==================== Curricular Logic ====================



    processCurricularOptions() {
        this.curricularData = {
            mps: new Set(),
            ras: new Set(),
            cas: new Set(),
            map: [] // { mp, ra, ca, cicle } tuples
        };

        // We will store canonical labels.
        // Code Collision Handling:
        // Some dynamics might produce "MP09" but be TIS or TAPD.
        // We rely on normalizeModule which checks Name first.
        // If Name matches, we get exact Cycle.
        // If Name is generic, we might check Dynamic's Target.

        this.dinamiques.forEach(d => {
            const curr = d.connexio_curricular || {};

            // Newer schema: connexio_curricular.unitats_formatives / moduls
            const units = curr.unitats_formatives || curr.moduls;
            if (Array.isArray(units) && units.length) {
                units.forEach(u => {
                    const rawCode = (u.codi || '').trim();
                    const rawName = (u.nom || '').trim();
                    let normalized = normalizeModule(rawCode, rawName);
                    if (!normalized || !normalized.code) return;

                    if (normalized.cycle === '?' && d.target && d.target.length === 1) {
                        const inferredCycle = d.target[0].toUpperCase();
                        normalized = {
                            ...normalized,
                            cycle: inferredCycle,
                            label: `${normalized.code} - ${normalized.name} [${inferredCycle}]`
                        };
                    }

                    const mpLabel = normalized.label || (rawCode || rawName);
                    if (!mpLabel) return;

                    this.curricularData.mps.add(mpLabel);
                    this.curricularData.map.push({ type: 'mp', val: mpLabel, cicle: normalized.cycle });

                    (u.resultats_aprenentatge || []).forEach(r => {
                        const ra = String(r.codi || r.descripcio || '').toUpperCase().trim();
                        if (ra) {
                            this.curricularData.ras.add(ra);
                            this.curricularData.map.push({ type: 'ra', val: ra, parentMp: mpLabel });
                        }

                        (r.criteris_avaluacio || []).forEach(ca => {
                            const caVal = String(ca).trim().toUpperCase();
                            if (caVal) {
                                this.curricularData.cas.add(caVal);
                                this.curricularData.map.push({ type: 'ca', val: caVal, parentRa: ra, parentMp: mpLabel });
                            }
                        });
                    });
                });

                return;
            }

            // Legacy schema fallback: modul_codi/modul + ra/ca
            const rawCode = (curr.modul_codi || '').trim();
            const rawName = (curr.modul || '').trim();

            let normalized = normalizeModule(rawCode, rawName);
            if (!normalized) return;
            if (normalized.cycle === '?' && d.target && d.target.length === 1 && rawCode) {
                const inferredCycle = d.target[0].toUpperCase();
                normalized = {
                    ...normalized,
                    cycle: inferredCycle,
                    label: `${rawCode} - ${rawName || 'Desconegut'} [${inferredCycle}]`,
                    code: rawCode
                };
            } else if (normalized.cycle === '?' && !rawCode && !rawName) {
                return;
            }
            if (!normalized.code) return;

            const mpLabel = normalized.label;
            const ra = (curr.ra || '').toUpperCase().trim();

            let cas = [];
            if (Array.isArray(curr.ca)) cas = curr.ca;
            else if (curr.ca) cas = [curr.ca];
            cas = cas.map(c => String(c).trim().toUpperCase());

            this.curricularData.mps.add(mpLabel);
            this.curricularData.map.push({ type: 'mp', val: mpLabel, cicle: normalized.cycle });

            if (ra) {
                this.curricularData.ras.add(ra);
                this.curricularData.map.push({ type: 'ra', val: ra, parentMp: mpLabel });
            }
            cas.forEach(ca => {
                if (ca) {
                    this.curricularData.cas.add(ca);
                    this.curricularData.map.push({ type: 'ca', val: ca, parentRa: ra, parentMp: mpLabel });
                }
            });
        });
    }

    updateCurricularDropdowns(cascade = false) {
        // Helper to populate select
        const populate = (select, values, current) => {
            // Keep "All" option
            select.innerHTML = select.options[0].outerHTML;
            const sorted = Array.from(values).sort();
            sorted.forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                if (val === current) opt.selected = true;
                select.appendChild(opt);
            });
            select.value = current; // Ensure value is set
        };

        // 1. MPs
        // If specific cycle selected, filter MPs?
        // For simplicity, just show all unique MPs found in data for now, 
        // effectively filtering by what's available in the filtered dataset would be better but requires more complex logic.
        // Let's stick to showing all MPs found in the loaded set.

        // 1. MPs
        let validMPs = new Set();
        if (this.filters.cicle !== 'all') {
            const selectedCycle = this.filters.cicle.toUpperCase();
            this.curricularData.map.forEach(item => {
                // cycle property in map is TIS or TAPD
                if (item.type === 'mp' && item.cicle === selectedCycle) {
                    validMPs.add(item.val);
                }
            });
        } else {
            validMPs = this.curricularData.mps;
        }

        // If currently selected MP is not in the valid list, reset it
        if (this.filters.mp !== 'all' && !validMPs.has(this.filters.mp)) {
            this.filters.mp = 'all';
        }

        // If cascade is false (initial load or cycle change), update MP list
        if (!cascade) {
            populate(this.mpFilter, validMPs, this.filters.mp);
        }

        // 2. RAs
        // Filter RAs based on selected MP
        let validRAs = new Set();
        if (this.filters.mp !== 'all') {
            this.curricularData.map.forEach(item => {
                if (item.type === 'ra' && item.parentMp === this.filters.mp) validRAs.add(item.val);
            });
        } else {
            validRAs = this.curricularData.ras;
        }
        populate(this.raFilter, validRAs, this.filters.ra);

        // 3. CAs
        // Filter CAs based on selected MP and/or RA
        let validCAs = new Set();
        this.curricularData.map.forEach(item => {
            if (item.type === 'ca') {
                let match = true;
                if (this.filters.mp !== 'all' && item.parentMp !== this.filters.mp) match = false;
                if (this.filters.ra !== 'all' && item.parentRa !== this.filters.ra) match = false;

                if (match) validCAs.add(item.val);
            }
        });
        populate(this.caFilter, validCAs, this.filters.ca);
    }

    async loadData() {
        this.showLoading();

        try {
            const params = new URLSearchParams();

            if (this.filters.cicle !== 'all') params.append('target', this.filters.cicle);
            if (this.filters.model !== 'all') params.append('model', this.filters.model);
            if (this.filters.categoria !== 'all') params.append('categoria', this.filters.categoria);
            if (this.filters.tipus !== 'all') params.append('tipus', this.filters.tipus);
            if (this.filters.search) params.append('search', this.filters.search);
            params.append('limit', '500');

            console.log('[loadData] Fetching with params:', params.toString());
            const response = await fetch(`/api/dinamiques?${params}`);
            const data = await response.json();

            console.log('[loadData] Received:', data.dinamiques?.length, 'dynamics, total:', data.total);

            this.dinamiques = data.dinamiques || [];
            this.totalCount = data.total || 0;

            console.log('[loadData] Loaded events. Processing curricular options...');
            this.processCurricularOptions(); // Extract unique MPs, RAs, CAs
            this.updateCurricularDropdowns(); // Initial populate

            console.log('[loadData] Before applyClientFilters, dinamiques:', this.dinamiques.length);
            this.applyClientFilters();
            console.log('[loadData] After applyClientFilters, filtered:', this.filtered.length);

            this.updateFilterChips();
            this.updateFilterBadge();

        } catch (error) {
            console.error('[loadData] Error:', error);
            this.showError("Error carregant les dades. Assegura't que el servidor està funcionant.");
        }
    }

    applyClientFilters() {
        this.filtered = this.dinamiques.filter(d => {
            // Time filter
            if (d.temps_total && d.temps_total > this.filters.temps) return false;

            // Soroll filter (noise level)
            if (d.soroll && d.soroll > this.filters.soroll) return false;

            // Participants filter - only apply if user has set a minimum
            // Show dynamics where your group size fits within the min-max range
            // Skip filter if set to 1 (default = show all)
            if (this.filters.participants > 1) {
                const min = d.participants_min || 1;
                const max = d.participants_max || 100;
                // Exclude if your group is too small or too big for this dynamic
                if (this.filters.participants < min || this.filters.participants > max) return false;
            }

            // Tag filter
            if (this.filters.tag) {
                const tags = (d.tags || []).map(t => t.toLowerCase());
                const hasMatchingTag = tags.some(t => t.includes(this.filters.tag));
                if (!hasMatchingTag) return false;
            }

            // Favorites only
            if (this.filters.favoritesOnly && !this.favorites.includes(d.id)) return false;

            // Curricular Filters (Client Side)
            const curr = d.connexio_curricular || {};
            const units = curr.unitats_formatives || curr.moduls;

            const matchMp = () => {
                if (this.filters.mp === 'all') return true;

                // Newer schema
                if (Array.isArray(units) && units.length) {
                    return units.some(u => {
                        const norm = normalizeModule(u.codi, u.nom);
                        const label = norm ? norm.label : (u.codi || u.nom);
                        return label === this.filters.mp;
                    });
                }

                // Legacy schema: compare code part
                const code = (curr.modul_codi || '').toUpperCase().trim();
                const filterCode = this.filters.mp.split(' - ')[0].trim();
                return code && code === filterCode;
            };

            const matchRa = () => {
                if (this.filters.ra === 'all') return true;

                if (Array.isArray(units) && units.length) {
                    return units.some(u => {
                        // If MP selected, restrict to that MP
                        if (this.filters.mp !== 'all') {
                            const norm = normalizeModule(u.codi, u.nom);
                            const label = norm ? norm.label : (u.codi || u.nom);
                            if (label !== this.filters.mp) return false;
                        }
                        return (u.resultats_aprenentatge || []).some(r => {
                            const ra = String(r.codi || r.descripcio || '').toUpperCase().trim();
                            return ra === this.filters.ra;
                        });
                    });
                }

                const ra = String(curr.ra || '').toUpperCase();
                return ra.includes(this.filters.ra);
            };

            const matchCa = () => {
                if (this.filters.ca === 'all') return true;

                const caClean = this.filters.ca.replace(/\s/g, '').toLowerCase();

                if (Array.isArray(units) && units.length) {
                    return units.some(u => {
                        if (this.filters.mp !== 'all') {
                            const norm = normalizeModule(u.codi, u.nom);
                            const label = norm ? norm.label : (u.codi || u.nom);
                            if (label !== this.filters.mp) return false;
                        }
                        return (u.resultats_aprenentatge || []).some(r => {
                            if (this.filters.ra !== 'all') {
                                const ra = String(r.codi || r.descripcio || '').toUpperCase().trim();
                                if (ra !== this.filters.ra) return false;
                            }
                            const cas = (r.criteris_avaluacio || []).map(ca => String(ca).replace(/\s/g, '').toLowerCase());
                            return cas.includes(caClean);
                        });
                    });
                }

                let cas = [];
                if (Array.isArray(curr.ca)) cas = curr.ca;
                else if (curr.ca) cas = [curr.ca];
                const dynamicCAs = cas.map(c => String(c).replace(/\s/g, '').toLowerCase()).join(',');
                return dynamicCAs.includes(caClean);
            };

            if (!matchMp()) return false;
            if (!matchRa()) return false;
            if (!matchCa()) return false;

            // Digital Filter
            if (this.filters.digital !== 'all') {
                const isDigital = (d.materials?.necessaris || []).some(m =>
                    (typeof m === 'object' && m.es_digital) ||
                    (typeof m === 'string' && m.toLowerCase().includes('digital'))
                ) || (d.tags || []).includes('digital');

                if (this.filters.digital === 'si' && !isDigital) return false;
                if (this.filters.digital === 'no' && isDigital) return false;
            }

            // Material Search
            if (this.filters.material) {
                const search = this.filters.material.toLowerCase();
                const materials = (d.materials?.necessaris || []).map(m =>
                    typeof m === 'object' ? (m.nom + ' ' + (m.descripcio || '')) : m
                ).join(' ').toLowerCase();

                if (!materials.includes(search)) return false;
            }

            // Vulnerability Filter (Max Level)
            if (d.seguretat_emocional?.nivell && this.filters.vulnerabilitat < 5) {
                let level = 1;
                const val = d.seguretat_emocional.nivell;
                if (typeof val === 'number') level = val;
                else if (typeof val === 'string') {
                    const v = val.toLowerCase();
                    if (v.includes('alt') || v.includes('5')) level = 5;
                    else if (v.includes('mitj') || v.includes('3') || v.includes('4')) level = 3;
                    else level = 1;
                }

                if (level > this.filters.vulnerabilitat) return false;
            }

            // Experience Filter
            if (this.filters.experiencia !== 'all') {
                const exp = (d.consells_docent?.experiencia_docent || 'baixa').toLowerCase();
                if (exp !== this.filters.experiencia) return false;
            }

            // Complexity Filter
            if (this.filters.complexitat !== 'all') {
                const comp = (d.complexitat_logistica || d.consells_docent?.complexitat_logistica || 'baixa').toLowerCase();
                if (comp !== this.filters.complexitat) return false;
            }

            // Quality Filter
            if (this.filters.qualitat > 0) {
                if ((d.qualitat || 0) < this.filters.qualitat) return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.sortAndRender();
    }

    sortAndRender() {
        // Sort
        switch (this.sort) {
            case 'title':
                this.filtered.sort((a, b) => (a.titol || '').localeCompare(b.titol || ''));
                break;
            case 'time-asc':
                this.filtered.sort((a, b) => (a.temps_total || 0) - (b.temps_total || 0));
                break;
            case 'time-desc':
                this.filtered.sort((a, b) => (b.temps_total || 0) - (a.temps_total || 0));
                break;
            case 'energy':
                this.filtered.sort((a, b) => (b.energia || 0) - (a.energia || 0));
                break;
            default: // recent
                this.filtered.sort((a, b) => b.id - a.id);
        }

        this.renderCards();
        this.updateResultsCount();
    }

    async loadMore() {
        this.currentPage++;
        this.renderCards(true);
    }

    // ==================== Rendering ====================

    renderCards(append = false) {
        const start = 0;
        const end = this.currentPage * this.pageSize;
        const visible = this.filtered.slice(start, end);

        if (visible.length === 0) {
            this.cardsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>Cap dinàmica trobada</h3>
                    <p>Prova a modificar els filtres per veure més resultats.</p>
                </div>
            `;
            this.loadMoreWrapper.classList.add('hidden');
            return;
        }

        if (!append) {
            this.cardsGrid.innerHTML = '';
        }

        const fragment = document.createDocumentFragment();
        const startIndex = append ? (this.currentPage - 1) * this.pageSize : 0;
        const items = append ? this.filtered.slice(startIndex, end) : visible;

        items.forEach(d => {
            const card = this.createCardElement(d);
            fragment.appendChild(card);
        });

        this.cardsGrid.appendChild(fragment);

        // Show/hide load more
        this.loadMoreWrapper.classList.toggle('hidden', end >= this.filtered.length);
    }

    createCardElement(d) {
        const card = document.createElement('article');
        card.className = 'card';
        card.dataset.id = d.id;

        const isFav = this.favorites.includes(d.id);

        const badges = (d.target || []).map(t =>
            `<span class="badge badge-${t.toLowerCase()}">${t}</span>`
        ).join('');

        const tags = (d.tags || []).slice(0, 3).map(tag =>
            `<span class="tag">${this.escapeHtml(tag.replace(/_/g, ' '))}</span>`
        ).join('');

        const moreTags = (d.tags?.length || 0) > 3 ? `<span class="tag">+${d.tags.length - 3}</span>` : '';

        card.innerHTML = `
            <div class="card-actions">
                <button class="card-action-btn ${isFav ? 'favorited' : ''}" data-action="favorite" title="Favorit">
                    ${isFav ? '★' : '☆'}
                </button>
                <button class="card-action-btn" data-action="compare" title="Comparar">⇆</button>
            </div>
            <div class="card-header">
                <div class="card-title-group">
                    <h3 class="card-title">${this.escapeHtml(d.titol || 'Sense títol')}</h3>
                    ${this.renderStars(d.qualitat)}
                </div>
                <div class="card-badges">${badges}</div>
            </div>
            <span class="card-type">${this.formatType(d.tipus_dinamica)}</span>
            <span class="card-model">${this.escapeHtml(d.model || '')}</span>
            <div class="card-meta">
                <span class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    ${d.temps_total || '?'} min
                </span>
                <span class="meta-item">
                    <span class="meta-icon">👥</span>
                    ${d.participants_min || '?'}-${d.participants_max || '?'}
                </span>
                <span class="meta-item">
                    <span class="meta-icon">🔊</span>
                    ${d.soroll ?? '?'}/5
                </span>
            </div>
            <div class="card-tags">${tags}${moreTags}</div>
        `;

        // Click to open modal
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-action-btn')) return;
            this.openModal(d.id);
        });

        // Action buttons
        card.querySelector('[data-action="favorite"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(d.id, d.titol);
        });

        card.querySelector('[data-action="compare"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.addToCompare(d);
        });

        return card;
    }

    renderModelBars(models) {
        if (!models || models.length === 0) return;

        const max = Math.max(...models.map(m => m.count));

        this.modelBars.innerHTML = models.slice(0, 5).map(m => `
            <div class="model-bar">
                <div class="model-bar-label">
                    <span class="model-bar-name">${this.escapeHtml(m.model)}</span>
                    <span class="model-bar-count">${m.count}</span>
                </div>
                <div class="model-bar-track">
                    <div class="model-bar-fill" style="width: ${(m.count / max) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }

    // ==================== Modal ====================

    async openModal(id) {
        try {
            const response = await fetch(`/api/dinamica/${id}`);
            const data = await response.json();

            this.currentDynamic = data;
            this.modalTitle.textContent = data.titol || 'Sense títol';

            const isFav = this.favorites.includes(id);
            this.modalFavorite.textContent = isFav ? '★' : '☆';
            this.modalFavorite.onclick = () => this.toggleFavorite(id, data.titol);

            this.modalBody.innerHTML = this.createModalContent(data);
            this.modalOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

        } catch (error) {
            this.showToast('Error carregant detalls', 'error');
        }
    }

    closeModal() {
        this.modalOverlay.classList.add('hidden');
        document.body.style.overflow = '';
        this.currentDynamic = null;
    }

    createModalContent(d) {
        const badges = (d.target || []).map(t =>
            `<span class="badge badge-${t.toLowerCase()}">${t}</span>`
        ).join('');

        const participants = d.participants || {};
        const espai = d.espai_i_ambient || d.entorn || {};
        const temps = d.temps || {};

        const objectius = d.objectius?.principals?.map(o => `<li>${this.escapeHtml(o)}</li>`).join('')
            || d.pedagogia?.objectius?.map(o => `<li>${this.escapeHtml(o)}</li>`).join('')
            || '<li>No especificats</li>';

        const materials = d.materials?.necessaris?.map(m => {
            const text = typeof m === 'object' ? (m.nom || m.descripcio || JSON.stringify(m)) : m;
            return `<li>${this.escapeHtml(text)}</li>`;
        }).join('') || '<li>No especificats</li>';

        const procediment = d.procediment?.map(fase => `
            <div class="fase-card">
                <div class="fase-header">
                    <span class="fase-name">${this.escapeHtml(fase.titol || fase.fase || fase.nom || 'Fase')}</span>
                    <span class="fase-time">${fase.temps_estimat_minuts || fase.temps_min || '?'} min</span>
                </div>
                <div class="fase-content">
                    ${fase.accio_docent ? `<p><strong>Docent:</strong> ${this.escapeHtml(fase.accio_docent)}</p>` : ''}
                    ${fase.accio_alumnat ? `<p><strong>Alumnat:</strong> ${this.escapeHtml(fase.accio_alumnat)}</p>` : ''}
                    ${fase.consigna_exacta || fase.consigna ?
                `<p class="fase-consigna">"${this.escapeHtml(fase.consigna_exacta || fase.consigna)}"</p>` : ''}
                </div>
            </div>
        `).join('') || '<p>No especificat</p>';

        const debrief = d.tancament_i_reflexio?.preguntes_debrief?.map(q => `<li>${this.escapeHtml(q)}</li>`).join('')
            || d.debrief?.preguntes_reflexio?.map(q => `<li>${this.escapeHtml(q)}</li>`).join('')
            || '<li>No especificades</li>';

        const tags = (d.tags || []).map(tag =>
            `<span class="tag">${tag.replace(/_/g, ' ')}</span>`
        ).join('');

        // Obtenir dades d'entorn de diferents camps possibles
        const soroll = espai.nivell_soroll ?? '?';
        const moviment = espai.nivell_moviment ?? '?';
        const complexitat = d.complexitat_logistica || 'N/A';
        const carrega = d.carrega_cognitiva || 'N/A';

        return `
            <div class="modal-meta">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; gap: 8px;">${badges}</div>
                    ${this.renderStars(d.qualitat)}
                </div>
                <span class="card-type">${this.formatType(d.tipus_dinamica)}</span>
                <span class="badge" style="background: var(--glass-bg); color: var(--text-secondary);">
                    ${d._model || d.generador_llm || 'Model desconegut'}
                </span>
            </div>
            
            <div class="card-meta" style="margin-bottom: 20px;">
                <span class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    ${temps.total_estimat_minuts || '?'} min (Prep: ${temps.preparacio_minuts || '0'}')
                </span>
                <span class="meta-item">
                    <span class="meta-icon">👥</span>
                    ${participants.minim || '?'}-${participants.maxim || '?'} (ideal: ${participants.ideal || '?'})
                </span>
                <span class="meta-item">
                    <span class="meta-icon">🔊</span>
                    Soroll: ${soroll}/5
                </span>
                <span class="meta-item">
                    <span class="meta-icon">🚶</span>
                    Moviment: ${moviment}/5
                </span>
            </div>
            
            <div class="card-tags" style="margin-bottom: 24px;">${tags}</div>
            
            ${d.resum ? `
            <div class="modal-section resum-section">
                <h3 class="modal-section-title">📝 Resum</h3>
                <p>${this.escapeHtml(d.resum)}</p>
            </div>
            ` : ''}
            
            <div class="modal-section">
                <h3 class="modal-section-title">🎯 Objectius pedagògics</h3>
                <ul>${objectius}</ul>
            </div>
            
            ${d.pedagogia?.pedagogy_rationale || d.fonamentacio ? `
            <div class="modal-section">
                <h3 class="modal-section-title">📚 Fonamentació pedagògica</h3>
                <p>${this.escapeHtml(d.pedagogia?.pedagogy_rationale || d.fonamentacio)}</p>
            </div>
            ` : ''}
            
            <div class="modal-section">
                <h3 class="modal-section-title">📦 Materials</h3>
                <ul>${materials}</ul>
            </div>
            
            <div class="modal-section">
                <h3 class="modal-section-title">📋 Procediment</h3>
                ${procediment}
            </div>
            
            <div class="modal-section">
                <h3 class="modal-section-title">💬 Preguntes de reflexió</h3>
                <ul>${debrief}</ul>
            </div>
            
            ${d.quan_usar?.length ? `
            <div class="modal-section">
                <h3 class="modal-section-title">📅 Quan usar</h3>
                <ul>${d.quan_usar.map(q => `<li>${this.escapeHtml(q)}</li>`).join('')}</ul>
            </div>
            ` : ''}
            
            ${d.seguretat_emocional ? `
            <div class="modal-section">
                <h3 class="modal-section-title">🛡️ Seguretat emocional</h3>
                <p><strong>Nivell:</strong> ${d.seguretat_emocional.nivell}</p>
                ${d.seguretat_emocional.detonants_probables?.length ? `
                    <p style="margin-top: 8px;"><strong>Detonants probables:</strong></p>
                    <ul>${d.seguretat_emocional.detonants_probables.map(det =>
            `<li>${this.escapeHtml(det)}</li>`).join('')}</ul>
                ` : ''}
            </div>
            ` : ''}
            
            ${d.variants?.length ? `
            <div class="modal-section">
                <h3 class="modal-section-title">🔄 Variants</h3>
                <ul>${d.variants.map(v => {
                if (typeof v === 'object') {
                    return `<li><strong>${this.escapeHtml(v.nom || v.titol || 'Variant')}:</strong> ${this.escapeHtml(v.descripcio || JSON.stringify(v))}</li>`;
                }
                return `<li>${this.escapeHtml(v)}</li>`;
            }).join('')}</ul>
            </div>
            ` : ''}
            
            ${d.adaptacions_accessibilitat ? `
            <div class="modal-section">
                <h3 class="modal-section-title">♿ Adaptacions d'accessibilitat</h3>
                ${this.formatValue(d.adaptacions_accessibilitat)}
            </div>
            ` : ''}
            
            ${d.consells_docent ? `
            <div class="modal-section">
                <h3 class="modal-section-title">💡 Consells pel docent</h3>
                ${this.formatConsells(d.consells_docent)}
            </div>
            ` : ''}
            
            ${d.connexio_curricular ? `
            <div class="modal-section">
                <h3 class="modal-section-title">📚 Connexió curricular</h3>
                ${this.formatValue(d.connexio_curricular)}
            </div>
            ` : ''}
            
            ${d.espai_i_ambient ? `
            <div class="modal-section">
                <h3 class="modal-section-title">🏫 Espai i Ambient</h3>
                <ul>
                    ${d.espai_i_ambient.mida_aula ? `<li><strong>Mida:</strong> ${d.espai_i_ambient.mida_aula}</li>` : ''}
                    ${d.espai_i_ambient.disposicio_inicial ? `<li><strong>Disposició:</strong> ${d.espai_i_ambient.disposicio_inicial}</li>` : ''}
                    ${d.espai_i_ambient.mobiliari ? `<li><strong>Mobiliari:</strong> ${d.espai_i_ambient.mobiliari}</li>` : ''}
                    ${d.espai_i_ambient.nivell_soroll ? `<li><strong>Soroll:</strong> ${d.espai_i_ambient.nivell_soroll}/5</li>` : ''}
                    ${d.espai_i_ambient.nivell_moviment ? `<li><strong>Moviment:</strong> ${d.espai_i_ambient.nivell_moviment}/5</li>` : ''}
                </ul>
            </div>
            ` : ''}
            
            ${d.avaluacio ? `
            <div class="modal-section">
                <h3 class="modal-section-title">📊 Avaluació</h3>
                ${this.formatValue(d.avaluacio)}
            </div>
            ` : ''}
            
            ${d.plan_b ? `
            <div class="modal-section">
                <h3 class="modal-section-title">🔧 Pla B</h3>
                ${this.formatValue(d.plan_b)}
            </div>
            ` : ''}
        `;
    }

    copyCurrentDynamic() {
        if (!this.currentDynamic) return;

        navigator.clipboard.writeText(JSON.stringify(this.currentDynamic, null, 2))
            .then(() => this.showToast('JSON copiat al portapapers', 'success'))
            .catch(() => this.showToast('Error copiant', 'error'));
    }

    // ==================== Favorites ====================

    toggleFavorite(id, title) {
        const index = this.favorites.indexOf(id);

        if (index === -1) {
            this.favorites.push(id);
            this.showToast(`"${title}" afegit a favorits`, 'success');
        } else {
            this.favorites.splice(index, 1);
            this.showToast(`"${title}" eliminat de favorits`, 'info');
        }

        localStorage.setItem('dinamiques_favorites', JSON.stringify(this.favorites));
        this.updateFavoritesSidebar();
        this.updateFavoriteButtons();

        // If favorites only filter is active, reload
        if (this.filters.favoritesOnly) {
            this.applyClientFilters();
        }
    }

    updateFavoritesSidebar() {
        this.favCount.textContent = this.favorites.length;

        if (this.favorites.length === 0) {
            this.favoritesList.innerHTML = '<p class="empty-favorites">Cap dinàmica desada</p>';
            return;
        }

        // Get favorite dynamics from loaded data
        const favDynamics = this.dinamiques.filter(d => this.favorites.includes(d.id));

        if (favDynamics.length === 0 && this.favorites.length > 0) {
            // Favorites exist but not loaded yet
            this.favoritesList.innerHTML = `<p class="empty-favorites">${this.favorites.length} favorits desats</p>`;
            return;
        }

        this.favoritesList.innerHTML = favDynamics.map(d => `
            <div class="favorite-item" data-id="${d.id}">
                <span class="favorite-title">${this.escapeHtml(d.titol)}</span>
                <button class="favorite-remove" data-id="${d.id}">✕</button>
            </div>
        `).join('');

        // Bind events
        this.favoritesList.querySelectorAll('.favorite-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('favorite-remove')) {
                    const id = parseInt(e.target.dataset.id);
                    const d = this.dinamiques.find(d => d.id === id);
                    this.toggleFavorite(id, d?.titol || 'Dinàmica');
                } else {
                    this.openModal(parseInt(item.dataset.id));
                }
            });
        });
    }

    updateFavoriteButtons() {
        this.cardsGrid.querySelectorAll('.card').forEach(card => {
            const id = parseInt(card.dataset.id);
            const btn = card.querySelector('[data-action="favorite"]');
            const isFav = this.favorites.includes(id);
            btn.textContent = isFav ? '★' : '☆';
            btn.classList.toggle('favorited', isFav);
        });

        // Update modal if open
        if (this.currentDynamic) {
            const isFav = this.favorites.includes(this.currentDynamic._db_id);
            this.modalFavorite.textContent = isFav ? '★' : '☆';
        }
    }

    // ==================== Compare ====================

    addToCompare(d) {
        if (this.compareList.length >= 3) {
            this.showToast('Màxim 3 dinàmiques per comparar', 'warning');
            return;
        }

        if (this.compareList.find(c => c.id === d.id)) {
            this.showToast('Ja està a la llista de comparació', 'info');
            return;
        }

        this.compareList.push(d);
        this.updateComparePanel();
    }

    updateComparePanel() {
        if (this.compareList.length === 0) {
            this.comparePanel.classList.add('hidden');
            return;
        }

        this.comparePanel.classList.remove('hidden');

        this.compareItems.innerHTML = this.compareList.map(d => `
            <span class="compare-item">${this.escapeHtml(d.titol)}</span>
        `).join('');

        this.doCompareBtn.disabled = this.compareList.length < 2;
        this.doCompareBtn.textContent = `Comparar (${this.compareList.length}/3)`;
    }

    clearCompare() {
        this.compareList = [];
        this.updateComparePanel();
    }

    showComparison() {
        // Open modal with comparison view
        this.showToast('Funció de comparació en desenvolupament', 'info');
    }

    // ==================== Filters ====================

    clearFilters() {
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

            // Advanced
            mp: 'all',
            ra: 'all',
            ca: 'all',
            digital: 'all',
            material: '',
            vulnerabilitat: 5,
            experiencia: 'all',
            complexitat: 'all'
        };

        // Reset UI
        this.cicleFilter.querySelectorAll('.toggle-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.value === 'all');
        });
        this.modelFilter.value = 'all';
        this.categoriaFilter.value = 'all';
        this.tipusFilter.value = 'all';
        this.tempsFilter.value = 120;
        this.tempsValue.textContent = '120 min';
        this.sorollFilter.value = 5;
        this.sorollValue.textContent = '5';
        this.participantsFilter.value = 1;
        this.participantsValue.textContent = 'Tots';
        this.tagFilter.value = '';
        this.favoritesOnly.checked = false;
        this.searchInput.value = '';
        this.searchClear.classList.add('hidden');

        // Reset Curricular UI
        this.mpFilter.value = 'all';
        this.raFilter.value = 'all';
        this.caFilter.value = 'all';

        // Reset New Filters
        this.digitalFilter.value = 'all';
        this.materialFilter.value = '';
        this.vulnerabilitatFilter.value = 5;
        this.vulnerabilitatValue.textContent = '5';
        this.experienciaFilter.value = 'all';
        this.complexitatFilter.value = 'all';
        this.qualitatFilter.value = 0;
        this.qualitatValue.textContent = 'Totes';

        this.updateCurricularDropdowns(); // Refresh lists and counts

        this.updateFilterChips();
        this.updateFilterBadge();
        this.loadData();
    }

    updateFilterChips() {
        const chips = [];

        if (this.filters.cicle !== 'all') {
            chips.push({ label: this.filters.cicle, key: 'cicle' });
        }
        if (this.filters.model !== 'all') {
            chips.push({ label: this.filters.model, key: 'model' });
        }
        if (this.filters.categoria !== 'all') {
            chips.push({ label: this.filters.categoria, key: 'categoria' });
        }
        if (this.filters.tipus !== 'all') {
            chips.push({ label: this.formatType(this.filters.tipus), key: 'tipus' });
        }
        if (this.filters.search) {
            chips.push({ label: `"${this.filters.search}"`, key: 'search' });
        }

        this.filterChips.innerHTML = chips.map(c => `
            <span class="filter-chip">
                ${this.escapeHtml(c.label)}
                <button class="chip-remove" data-key="${c.key}">✕</button>
            </span>
        `).join('');

        // Bind chip remove events
        this.filterChips.querySelectorAll('.chip-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                if (key === 'search') {
                    this.searchInput.value = '';
                    this.searchClear.classList.add('hidden');
                }
                this.filters[key] = key === 'search' ? '' : 'all';
                this.loadData();
            });
        });
    }

    updateFilterBadge() {
        let count = 0;
        if (this.filters.cicle !== 'all') count++;
        if (this.filters.model !== 'all') count++;
        if (this.filters.categoria !== 'all') count++;
        if (this.filters.tipus !== 'all') count++;
        if (this.filters.temps < 120) count++;
        if (this.filters.participants > 1) count++;
        if (this.filters.favoritesOnly) count++;

        // Advanced
        if (this.filters.mp !== 'all') count++;
        if (this.filters.ra !== 'all') count++;
        if (this.filters.ca !== 'all') count++;
        if (this.filters.digital !== 'all') count++;
        if (this.filters.material) count++;
        if (this.filters.vulnerabilitat < 5) count++;
        if (this.filters.experiencia !== 'all') count++;
        if (this.filters.complexitat !== 'all') count++;
        if (this.filters.qualitat > 0) count++;

        this.filterBadge.textContent = count;
        this.filterBadge.classList.toggle('hidden', count === 0);
    }

    updateResultsCount() {
        const showing = Math.min(this.currentPage * this.pageSize, this.filtered.length);
        this.resultsCount.textContent = `Mostrant ${showing} de ${this.filtered.length} dinàmiques`;
    }

    // ==================== UI Helpers ====================

    showLoading() {
        this.cardsGrid.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Carregant dinàmiques...</p>
            </div>
        `;
    }

    showError(message) {
        this.cardsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <h3>Error</h3>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
        `;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    animateNumber(el, target) {
        const duration = 600;
        const start = 0;
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

            el.textContent = Math.round(start + (target - start) * eased);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    }

    formatType(type) {
        if (!type) return 'Desconegut';
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    formatConsells(val) {
        if (!val) return '';
        if (typeof val === 'string') return `<p>${this.escapeHtml(val)}</p>`;
        return this.formatValue(val);
    }

    // Helper to format complex nested values into readable HTML
    formatValue(value, depth = 0) {
        if (value === null || value === undefined) return '';

        // Simple types
        if (typeof value === 'string') return this.escapeHtml(value);
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);

        // Arrays
        if (Array.isArray(value)) {
            if (value.length === 0) return '';
            // Check if array of simple strings
            if (value.every(v => typeof v === 'string')) {
                return `<ul class="info-list">${value.map(v => `<li>${this.escapeHtml(v)}</li>`).join('')}</ul>`;
            }
            // Array of objects
            return value.map(v => this.formatValue(v, depth + 1)).join('');
        }

        // Objects - render as definition list
        if (typeof value === 'object') {
            const entries = Object.entries(value).filter(([k, v]) => v !== null && v !== undefined && v !== '');
            if (entries.length === 0) return '';

            return `<div class="info-block">
                ${entries.map(([key, val]) => {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const formattedVal = this.formatValue(val, depth + 1);

                // If the value became a list or block, put it below the label
                if (formattedVal.includes('<ul') || formattedVal.includes('<div')) {
                    return `<div class="info-row"><span class="info-label">${this.escapeHtml(label)}:</span>${formattedVal}</div>`;
                }
                return `<div class="info-row"><span class="info-label">${this.escapeHtml(label)}:</span> <span class="info-value">${formattedVal}</span></div>`;
            }).join('')}
            </div>`;
        }

        return String(value);
    }

    renderStars(score) {
        if (!score || score <= 0) return '';
        const fullStars = Math.floor(score);
        const halfStar = (score % 1) >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        let html = `<div class="star-rating" title="${score} estrelles">`;
        for (let i = 0; i < fullStars; i++) html += '<span class="star">★</span>';
        if (halfStar) html += '<span class="star">★</span>'; // You could use a half-star char if available, but full colored works well with colors
        for (let i = 0; i < emptyStars; i++) html += '<span class="star empty">★</span>';
        html += `<span class="star-text">${score}</span></div>`;
        return html;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.viewer = new DinamiquesViewer();
});
