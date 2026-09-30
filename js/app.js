/**
 * RUBIELLE - ARQUITECTURA MODULAR JAVASCRIPT PRO
 * Módulos: State, Financials, UI, Handlers, Toast
 */

// CATÁLOGO INICIAL DE RESPALDO (POR SI NO EXISTE CATALOG.JSON)
const DEFAULT_INITIAL_CATALOG = [
    { "ID": "LP01", "Nombre": "Rosa Clásica (Limpiapipas)", "Categoría": "Limpiapipas", "Costo Material (S/)": 1.20, "Tiempo (min)": 25, "Descripción": "3 limpiapipas rojos, 1 verde, alambre fino" },
    { "ID": "LP02", "Nombre": "Girasol Grande (Limpiapipas)", "Categoría": "Limpiapipas", "Costo Material (S/)": 1.80, "Tiempo (min)": 35, "Descripción": "5 limpiapipas amarillos, centro marrón" },
    { "ID": "CR01", "Nombre": "Tulipán Crochet", "Categoría": "Crochet", "Costo Material (S/)": 2.50, "Tiempo (min)": 45, "Descripción": "Hilado de algodón, relleno sintético" },
    { "ID": "AM01", "Nombre": "Oso Amigurumi Mediano", "Categoría": "Amigurumis", "Costo Material (S/)": 6.50, "Tiempo (min)": 120, "Descripción": "Lana antialérgica, ojos de seguridad" },
    { "ID": "INS01", "Nombre": "Papel Coreano", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.80, "Tiempo (min)": 0, "Descripción": "Pliego impermeable rosa/blanco" },
    { "ID": "INS02", "Nombre": "Cinta Satinada", "Categoría": "Empaque / Ensamble", "Costo Material (S/)": 0.50, "Tiempo (min)": 0, "Descripción": "Moño decorativo 2.5cm" }
];

// MÓDULO 1: ESTADO DEL SISTEMA
const State = {
    data: {
        catalog: [],
        defaultCatalog: [],
        cartFlowers: {},
        cartInsumos: {},
        history: [],
        workshopConfig: {
            costoHora: 5.0,
            factorMargen: 1.20,
            tiempoEnsamble: 120,
            porcentajeMerma: 5.0
        }
    },

    async init() {
        const savedCatalog = localStorage.getItem('rubielle_catalog');
        
        try {
            const response = await fetch('catalog.json');
            if (response.ok) {
                this.data.defaultCatalog = await response.json();
            } else {
                this.data.defaultCatalog = [...DEFAULT_INITIAL_CATALOG];
            }
        } catch (error) {
            console.warn('Uso de catálogo estático de respaldo por restricción de red/servidor:', error);
            this.data.defaultCatalog = [...DEFAULT_INITIAL_CATALOG];
        }

        if (savedCatalog) {
            try {
                this.data.catalog = JSON.parse(savedCatalog);
            } catch (e) {
                this.data.catalog = [...this.data.defaultCatalog];
            }
        } else {
            this.data.catalog = [...this.data.defaultCatalog];
        }

        try {
            this.data.cartFlowers = JSON.parse(localStorage.getItem('rubielle_cartFlowers')) || {};
            this.data.cartInsumos = JSON.parse(localStorage.getItem('rubielle_cartInsumos')) || {};
            this.data.history = JSON.parse(localStorage.getItem('rubielle_history')) || [];
        } catch (e) {
            this.data.cartFlowers = {};
            this.data.cartInsumos = {};
            this.data.history = [];
        }
        
        const savedConfig = localStorage.getItem('rubielle_workshopConfig');
        if (savedConfig) {
            try {
                this.data.workshopConfig = { ...this.data.workshopConfig, ...JSON.parse(savedConfig) };
            } catch (e) {}
        }
    },

    save() {
        localStorage.setItem('rubielle_catalog', JSON.stringify(this.data.catalog));
        localStorage.setItem('rubielle_cartFlowers', JSON.stringify(this.data.cartFlowers));
        localStorage.setItem('rubielle_cartInsumos', JSON.stringify(this.data.cartInsumos));
        localStorage.setItem('rubielle_history', JSON.stringify(this.data.history));
        localStorage.setItem('rubielle_workshopConfig', JSON.stringify(this.data.workshopConfig));
    }
};

// MÓDULO 2: MOTOR FINANCIERO
const Financials = {
    calculate() {
        const config = State.data.workshopConfig;
        let cmFlores = 0;
        let tiempoFloresMin = 0;

        Object.entries(State.data.cartFlowers).forEach(([name, qty]) => {
            const match = State.data.catalog.find(i => i.Nombre === name);
            if (match) {
                cmFlores += (match["Costo Material (S/)"] || 0) * qty;
                tiempoFloresMin += (match["Tiempo (min)"] || 0) * qty;
            }
        });

        let cmInsumos = 0;
        Object.entries(State.data.cartInsumos).forEach(([name, qty]) => {
            const match = State.data.catalog.find(i => i.Nombre === name);
            if (match) {
                cmInsumos += (match["Costo Material (S/)"] || 0) * qty;
            }
        });

        const subtotalMateriales = cmFlores + cmInsumos;
        const mermaRate = config.porcentajeMerma || 0;
        const costoMerma = subtotalMateriales * (mermaRate / 100);
        const cmTotal = subtotalMateriales + costoMerma;

        const tiempoTotalMin = tiempoFloresMin + (config.tiempoEnsamble || 0);
        const horasTotales = tiempoTotalMin / 60.0;
        const moTotal = horasTotales * config.costoHora;
        const costoBase = cmTotal + moTotal;
        const precioFinal = costoBase * config.factorMargen;
        const gananciaNeta = precioFinal - costoBase;

        return {
            cmFlores,
            cmInsumos,
            subtotalMateriales,
            costoMerma,
            mermaRate,
            cmTotal,
            tiempoTotalMin,
            horasTotales,
            moTotal,
            costoBase,
            precioFinal,
            gananciaNeta
        };
    }
};

// MÓDULO 3: RENDERIZADO Y VISTAS DE INTERFAZ (UI)
const UI = {
    setActiveTab(tabId) {
        const tabs = ['builder', 'insumos', 'history', 'catalog'];
        tabs.forEach(t => {
            const content = document.getElementById(`tab-content-${t}`);
            const navBtn = document.getElementById(`nav-tab-${t}`);
            const mobBtn = document.getElementById(`mob-tab-${t}`);

            if (content) {
                if (t === tabId) {
                    content.classList.remove('hidden');
                    if (navBtn) navBtn.className = "nav-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 bg-rubielle-500 text-white shadow-xs";
                    if (mobBtn) mobBtn.className = "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-rubielle-500 text-white shadow-xs";
                } else {
                    content.classList.add('hidden');
                    if (navBtn) navBtn.className = "nav-btn px-4 py-1.5 rounded-full text-xs font-bold text-slate-text dark:text-slate-300 hover:text-rubielle-600 transition-all duration-200 hover:bg-rubielle-50 dark:hover:bg-slate-700/50";
                    if (mobBtn) mobBtn.className = "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-text dark:text-slate-200 border border-rubielle-200 dark:border-slate-700";
                }
            }
        });
    },

    toggleTheme() {
        const html = document.documentElement;
        const themeIcon = document.getElementById('theme-toggle-icon');
        
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('rubielle_theme', 'light');
            if (themeIcon) themeIcon.className = 'fa-solid fa-moon text-sm';
        } else {
            html.classList.add('dark');
            localStorage.setItem('rubielle_theme', 'dark');
            if (themeIcon) themeIcon.className = 'fa-solid fa-sun text-sm';
        }
    },

    initTheme() {
        const savedTheme = localStorage.getItem('rubielle_theme');
        const themeIcon = document.getElementById('theme-toggle-icon');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
            if (themeIcon) themeIcon.className = 'fa-solid fa-sun text-sm';
        } else {
            document.documentElement.classList.remove('dark');
            if (themeIcon) themeIcon.className = 'fa-solid fa-moon text-sm';
        }
    },

    populatePieceSelect(filterText = '') {
        const select = document.getElementById('select-piezas');
        if (!select) return;
        
        const currentVal = select.value;
        select.innerHTML = '';
        
        const flowers = State.data.catalog.filter(i => 
            i.Categoría !== "Empaque / Ensamble" && 
            i.Nombre.toLowerCase().includes(filterText.toLowerCase())
        );
        
        if (flowers.length === 0) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = "No se encontraron flores/piezas";
            select.appendChild(opt);
            return;
        }

        flowers.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.Nombre;
            opt.textContent = `${item.Nombre} (${item.Categoría}) - S/ ${(item["Costo Material (S/)"] || 0).toFixed(2)}`;
            select.appendChild(opt);
        });

        if (currentVal) select.value = currentVal;
    },

    renderCartItems() {
        const flowersContainer = document.getElementById('cart-flowers-list');
        const insumosContainer = document.getElementById('cart-insumos-list');
        if (!flowersContainer || !insumosContainer) return;

        flowersContainer.innerHTML = '';
        insumosContainer.innerHTML = '';

        let totalCount = 0;

        // Render Flores
        const flowerEntries = Object.entries(State.data.cartFlowers).filter(([_, qty]) => qty > 0);
        if (flowerEntries.length === 0) {
            flowersContainer.innerHTML = `<p class="text-xs text-slate-muted dark:text-slate-400 italic py-2">No hay flores o piezas agregadas.</p>`;
        } else {
            flowerEntries.forEach(([name, qty]) => {
                totalCount += qty;
                const match = State.data.catalog.find(i => i.Nombre === name);
                const costUnit = match ? (match["Costo Material (S/)"] || 0) : 0;
                const subtotal = costUnit * qty;

                const row = document.createElement('div');
                row.className = "flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-rubielle-100 dark:border-slate-700 shadow-xs";
                row.innerHTML = `
                    <div class="flex-grow pr-2">
                        <p class="text-xs font-bold text-slate-dark dark:text-slate-100">${name}</p>
                        <p class="text-[10px] text-slate-muted dark:text-slate-400">S/ ${costUnit.toFixed(2)} c/u | Subtotal: <span class="font-bold text-rubielle-700 dark:text-rubielle-300">S/ ${subtotal.toFixed(2)}</span></p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="number" min="1" value="${qty}" class="cart-flower-qty w-14 px-2 py-1 bg-rubielle-50 dark:bg-slate-800 rounded-lg border border-rubielle-200 dark:border-slate-700 text-xs font-bold text-center dark:text-slate-100">
                        <button class="cart-flower-remove text-slate-400 hover:text-rose-500 p-1">
                            <i class="fa-solid fa-xmark text-sm"></i>
                        </button>
                    </div>
                `;
            
                const inputQty = row.querySelector('.cart-flower-qty');
                inputQty.addEventListener('change', (e) => Handlers.updateCartFlowerQty(name, e.target.value));

                const btnRemove = row.querySelector('.cart-flower-remove');
                btnRemove.addEventListener('click', () => Handlers.removeCartFlower(name));

                flowersContainer.appendChild(row);
            });
        }

        // Render Insumos
        const insumosEntries = Object.entries(State.data.cartInsumos).filter(([_, qty]) => qty > 0);
        if (insumosEntries.length === 0) {
            insumosContainer.innerHTML = `<p class="text-xs text-slate-muted dark:text-slate-400 italic py-2">No hay insumos de empaque cargados.</p>`;
        } else {
            insumosEntries.forEach(([name, qty]) => {
                totalCount += qty;
                const match = State.data.catalog.find(i => i.Nombre === name);
                const costUnit = match ? (match["Costo Material (S/)"] || 0) : 0;
                const subtotal = costUnit * qty;

                const row = document.createElement('div');
                row.className = "flex items-center justify-between p-2.5 rounded-2xl bg-cream-50 dark:bg-slate-900 border border-rubielle-100 dark:border-slate-700 shadow-xs";
                row.innerHTML = `
                    <div class="flex-grow pr-2">
                        <p class="text-xs font-bold text-slate-dark dark:text-slate-100">${name}</p>
                        <p class="text-[10px] text-slate-muted dark:text-slate-400">S/ ${costUnit.toFixed(2)} c/u | Subtotal: <span class="font-bold text-slate-dark dark:text-slate-200">S/ ${subtotal.toFixed(2)}</span></p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="number" min="0" value="${qty}" class="cart-insumo-qty w-14 px-2 py-1 bg-white dark:bg-slate-800 rounded-lg border border-rubielle-200 dark:border-slate-700 text-xs font-bold text-center dark:text-slate-100">
                        <button class="cart-insumo-remove text-slate-400 hover:text-rose-500 p-1">
                            <i class="fa-solid fa-xmark text-sm"></i>
                        </button>
                    </div>
                `;

                const inputQty = row.querySelector('.cart-insumo-qty');
                inputQty.addEventListener('change', (e) => Handlers.updateCartInsumoQty(name, e.target.value));

                const btnRemove = row.querySelector('.cart-insumo-remove');
                btnRemove.addEventListener('click', () => Handlers.removeCartInsumo(name));

                insumosContainer.appendChild(row);
            });
        }

        const cartBadge = document.getElementById('cart-item-count');
        if (cartBadge) cartBadge.textContent = totalCount;
    },

    renderFinancialSummary() {
        const results = Financials.calculate();
        const config = State.data.workshopConfig;

        const inputCostoHora = document.getElementById('input-costo-hora');
        const sliderMargen = document.getElementById('slider-margen');
        const inputTiempoEnsamble = document.getElementById('input-tiempo-ensamble');
        const inputMerma = document.getElementById('input-porcentaje-merma');

        if (inputCostoHora) inputCostoHora.value = config.costoHora.toFixed(2);
        if (sliderMargen) sliderMargen.value = config.factorMargen;
        if (inputTiempoEnsamble) inputTiempoEnsamble.value = config.tiempoEnsamble;
        if (inputMerma) inputMerma.value = config.porcentajeMerma || 0;

        const dispCostoHora = document.getElementById('display-costo-hora');
        const dispMargen = document.getElementById('display-margen-factor');
        const dispTiempo = document.getElementById('display-tiempo-ensamble');
        const dispMerma = document.getElementById('display-porcentaje-merma');

        if (dispCostoHora) dispCostoHora.textContent = `S/ ${config.costoHora.toFixed(2)} / h`;
        if (dispMargen) dispMargen.textContent = `${config.factorMargen.toFixed(2)}x`;
        if (dispTiempo) dispTiempo.textContent = `${config.tiempoEnsamble} min`;
        if (dispMerma) dispMerma.textContent = `${config.porcentajeMerma || 0}%`;

        const elCostMat = document.getElementById('metric-costo-mat');
        if (elCostMat) elCostMat.textContent = `S/ ${results.cmTotal.toFixed(2)}`;
        
        const elSubMat = document.getElementById('metric-sub-mat');
        if (elSubMat) {
            elSubMat.textContent = `Flores: S/ ${results.cmFlores.toFixed(2)} | Ins: S/ ${results.cmInsumos.toFixed(2)} | Merma (${results.mermaRate}%): S/ ${results.costoMerma.toFixed(2)}`;
        }
        
        const elTiempoTotal = document.getElementById('metric-tiempo-total');
        if (elTiempoTotal) elTiempoTotal.textContent = `${results.horasTotales.toFixed(1)} hrs`;
        
        const elSubTiempo = document.getElementById('metric-sub-tiempo');
        if (elSubTiempo) elSubTiempo.textContent = `Total: ${results.tiempoTotalMin} minutos`;

        const elMO = document.getElementById('metric-mano-obra');
        if (elMO) elMO.textContent = `S/ ${results.moTotal.toFixed(2)}`;
        
        const elSubCostoBase = document.getElementById('metric-sub-costo-base');
        if (elSubCostoBase) elSubCostoBase.textContent = `Costo Base: S/ ${results.costoBase.toFixed(2)}`;

        const elMargenNeto = document.getElementById('metric-margen-neto');
        if (elMargenNeto) elMargenNeto.textContent = `S/ ${results.gananciaNeta.toFixed(2)}`;
        
        const elPrecioSugerido = document.getElementById('metric-precio-sugerido');
        if (elPrecioSugerido) elPrecioSugerido.textContent = `S/ ${results.precioFinal.toFixed(2)}`;

        Handlers.generateProformaText();
    },

    renderInsumosGrid() {
        const container = document.getElementById('insumos-grid-container');
        if (!container) return;
        
        const searchInput = document.getElementById('input-search-insumos');
        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const insumos = State.data.catalog.filter(i => i.Categoría === "Empaque / Ensamble" && i.Nombre.toLowerCase().includes(search));
        
        container.innerHTML = '';
        insumos.forEach(item => {
            const qty = State.data.cartInsumos[item.Nombre] || 0;
            const unitCost = item["Costo Material (S/)"] || 0;
            const subtotal = qty * unitCost;

            const card = document.createElement('div');
            card.className = "p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rubielle-100 dark:border-slate-700 shadow-xs space-y-2";
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="text-xs font-bold text-slate-dark dark:text-slate-100"></h4>
                        <p class="text-[10px] text-slate-muted dark:text-slate-400">Costo: S/ ${unitCost.toFixed(2)}</p>
                    </div>
                    <span class="text-[10px] bg-rubielle-50 dark:bg-rubielle-900/50 text-rubielle-700 dark:text-rubielle-300 font-bold px-2 py-0.5 rounded-md">
                        Sub: S/ ${subtotal.toFixed(2)}
                    </span>
                </div>
                <div class="flex items-center space-x-2 pt-1">
                    <button class="btn-dec w-7 h-7 rounded-lg bg-rubielle-50 dark:bg-slate-800 hover:bg-rubielle-100 dark:hover:bg-slate-700 text-rubielle-700 dark:text-rubielle-300 font-bold text-xs">-</button>
                    <input type="number" min="0" value="${qty}" class="input-qty w-full py-1 bg-cream-50 dark:bg-slate-800 dark:text-slate-100 rounded-lg border border-rubielle-200 dark:border-slate-700 text-xs font-bold text-center">
                    <button class="btn-inc w-7 h-7 rounded-lg bg-rubielle-50 dark:bg-slate-800 hover:bg-rubielle-100 dark:hover:bg-slate-700 text-rubielle-700 dark:text-rubielle-300 font-bold text-xs">+</button>
                </div>
            `;

            card.querySelector('h4').textContent = item.Nombre;

            const btnDec = card.querySelector('.btn-dec');
            const btnInc = card.querySelector('.btn-inc');
            const inputQty = card.querySelector('.input-qty');

            btnDec.addEventListener('click', () => Handlers.updateCartInsumoQty(item.Nombre, Math.max(0, qty - 1)));
            btnInc.addEventListener('click', () => Handlers.updateCartInsumoQty(item.Nombre, qty + 1));
            inputQty.addEventListener('change', (e) => Handlers.updateCartInsumoQty(item.Nombre, e.target.value));

            container.appendChild(card);
        });
    },

    renderCatalogTable() {
        const tbody = document.getElementById('catalog-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const searchInput = document.getElementById('input-search-catalog');
        const catSelect = document.getElementById('select-category-catalog');
        
        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const catFilter = catSelect ? catSelect.value : 'ALL';

        const filtered = State.data.catalog.filter(i => {
            const matchSearch = (i.Nombre || '').toLowerCase().includes(search) || (i.ID || '').toLowerCase().includes(search) || (i.Descripción || '').toLowerCase().includes(search);
            const matchCat = (catFilter === 'ALL') || (i.Categoría === catFilter);
            return matchSearch && matchCat;
        });

        filtered.forEach(item => {
            const row = document.createElement('tr');
            row.className = "hover:bg-rubielle-50/50 dark:hover:bg-slate-800/50 transition-colors";
            
            const cost = item["Costo Material (S/)"] || 0;
            const time = item["Tiempo (min)"] || 0;

            row.innerHTML = `
                <td class="p-3 font-mono font-bold text-rubielle-700 dark:text-rubielle-300"></td>
                <td class="p-3 font-bold text-slate-dark dark:text-slate-100"></td>
                <td class="p-3"><span class="px-2 py-0.5 rounded-full bg-rubielle-100 dark:bg-rubielle-900/60 text-rubielle-700 dark:text-rubielle-300 text-[10px] font-bold"></span></td>
                <td class="p-3 font-bold">S/ ${cost.toFixed(2)}</td>
                <td class="p-3 font-bold">${time} min</td>
                <td class="p-3 text-[11px] text-slate-muted dark:text-slate-400"></td>
                <td class="p-3 text-right space-x-1">
                    <button class="btn-edit p-1.5 text-slate-400 hover:text-rubielle-600 dark:hover:text-rubielle-400 transition-colors" title="Editar Elemento">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-delete p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Eliminar Elemento">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;

            row.children[0].textContent = item.ID;
            row.children[1].textContent = item.Nombre;
            row.children[2].querySelector('span').textContent = item.Categoría;
            row.children[5].textContent = item.Descripción || '-';

            row.querySelector('.btn-edit').addEventListener('click', () => UI.openItemModal(item.ID));
            row.querySelector('.btn-delete').addEventListener('click', () => Handlers.deleteCatalogItem(item.ID));

            tbody.appendChild(row);
        });
    },

    renderHistoryTable() {
        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        let totalVentas = 0;
        let totalGanancia = 0;

        if (State.data.history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-slate-muted dark:text-slate-400 italic">Aún no se han registrado ventas en el historial.</td></tr>`;
        } else {
            State.data.history.forEach((item) => {
                totalVentas += (item.precioVenta || 0);
                totalGanancia += (item.ganancia || 0);

                const row = document.createElement('tr');
                row.className = "hover:bg-rubielle-50/50 dark:hover:bg-slate-800/50 transition-colors";
                row.innerHTML = `
                    <td class="p-3 text-slate-muted dark:text-slate-400"></td>
                    <td class="p-3 font-bold text-slate-dark dark:text-slate-100"></td>
                    <td class="p-3 font-medium"></td>
                    <td class="p-3">S/ ${(item.costoBase || 0).toFixed(2)}</td>
                    <td class="p-3 font-bold text-rubielle-700 dark:text-rubielle-300">S/ ${(item.precioVenta || 0).toFixed(2)}</td>
                    <td class="p-3 font-bold text-emerald-600 dark:text-emerald-400">S/ ${(item.ganancia || 0).toFixed(2)}</td>
                    <td class="p-3 text-[11px] text-slate-muted dark:text-slate-400"></td>
                    <td class="p-3 text-right">
                        <button class="btn-delete-rec p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Eliminar Registro">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                `;

                row.children[0].textContent = item.fecha;
                row.children[1].textContent = item.cliente;
                row.children[2].textContent = item.ramo;
                row.children[6].textContent = item.detalle;

                row.querySelector('.btn-delete-rec').addEventListener('click', () => Handlers.deleteHistoryRecord(item.id));

                tbody.appendChild(row);
            });
        }

        const elHistVentas = document.getElementById('hist-metric-total-ventas');
        const elHistGanancia = document.getElementById('hist-metric-total-ganancia');
        const elHistCount = document.getElementById('hist-metric-total-count');

        if (elHistVentas) elHistVentas.textContent = `S/ ${totalVentas.toFixed(2)}`;
        if (elHistGanancia) elHistGanancia.textContent = `S/ ${totalGanancia.toFixed(2)}`;
        if (elHistCount) elHistCount.textContent = State.data.history.length;
    },

    openItemModal(itemId = null) {
        const modal = document.getElementById('modal-item-editor');
        const title = document.getElementById('modal-item-title');
        if (!modal) return;
        
        if (itemId) {
            const item = State.data.catalog.find(i => i.ID === itemId);
            if (item) {
                if (title) title.textContent = "Editar Material / Flor";
                document.getElementById('edit-item-original-id').value = item.ID;
                document.getElementById('edit-item-id').value = item.ID;
                document.getElementById('edit-item-name').value = item.Nombre;
                document.getElementById('edit-item-category').value = item.Categoría;
                document.getElementById('edit-item-cost').value = item["Costo Material (S/)"].toFixed(2);
                document.getElementById('edit-item-time').value = item["Tiempo (min)"];
                document.getElementById('edit-item-desc').value = item.Descripción || "";
            }
        } else {
            if (title) title.textContent = "Agregar Nuevo Material / Flor";
            const form = document.getElementById('form-item-editor');
            if (form) form.reset();
            document.getElementById('edit-item-original-id').value = "";
        }
        modal.classList.remove('hidden');
    },

    closeItemModal() {
        const modal = document.getElementById('modal-item-editor');
        if (modal) modal.classList.add('hidden');
    }
};

// MÓDULO 4: MANEJADORES DE EVENTOS
const Handlers = {
    handleWorkshopConfigChange() {
        const inputCostoHora = document.getElementById('input-costo-hora');
        const sliderMargen = document.getElementById('slider-margen');
        const inputTiempoEnsamble = document.getElementById('input-tiempo-ensamble');
        const inputMerma = document.getElementById('input-porcentaje-merma');

        if (inputCostoHora) State.data.workshopConfig.costoHora = parseFloat(inputCostoHora.value) || 0;
        if (sliderMargen) State.data.workshopConfig.factorMargen = parseFloat(sliderMargen.value) || 1.0;
        if (inputTiempoEnsamble) State.data.workshopConfig.tiempoEnsamble = parseInt(inputTiempoEnsamble.value) || 0;
        if (inputMerma) State.data.workshopConfig.porcentajeMerma = parseFloat(inputMerma.value) || 0;
        
        State.save();
        UI.renderFinancialSummary();
    },

    addItemFromSelect() {
        const nameSelect = document.getElementById('select-piezas');
        const qtyInput = document.getElementById('input-add-qty');
        
        const name = nameSelect ? nameSelect.value : '';
        const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

        if (name) {
            State.data.cartFlowers[name] = (State.data.cartFlowers[name] || 0) + qty;
            State.save();
            UI.renderCartItems();
            UI.renderFinancialSummary();
            Toast.show(`Añadido: ${qty}x ${name}`, 'success');
        } else {
            Toast.show('Selecciona una pieza válida', 'error');
        }
    },

    updateCartFlowerQty(name, val) {
        const v = parseInt(val) || 0;
        if (v <= 0) delete State.data.cartFlowers[name];
        else State.data.cartFlowers[name] = v;
        State.save();
        UI.renderCartItems();
        UI.renderFinancialSummary();
    },

    removeCartFlower(name) {
        delete State.data.cartFlowers[name];
        State.save();
        UI.renderCartItems();
        UI.renderFinancialSummary();
    },

    updateCartInsumoQty(name, val) {
        const v = parseInt(val) || 0;
        if (v <= 0) delete State.data.cartInsumos[name];
        else State.data.cartInsumos[name] = v;
        State.save();
        UI.renderCartItems();
        UI.renderInsumosGrid();
        UI.renderFinancialSummary();
    },

    removeCartInsumo(name) {
        delete State.data.cartInsumos[name];
        State.save();
        UI.renderCartItems();
        UI.renderInsumosGrid();
        UI.renderFinancialSummary();
    },

    loadDefaultPack() {
        const totalFlowers = Object.values(State.data.cartFlowers).reduce((a, b) => a + b, 0) || 1;
        State.data.cartInsumos = {
            "Alambre": 1,
            "Base": 1,
            "Biruta": 1,
            "Blonda": 1,
            "Bolsa/Empaque": 1,
            "Brochetas": totalFlowers,
            "Floratei": totalFlowers,
            "Caja": 1,
            "Cinta adhesiva": 1,
            "Cinta gruesa/grande": 1,
            "Cinta satinada": 1,
            "Cinta organza": 1,
            "Cinta de caja": 1,
            "Dulce": 1,
            "Ganchito": 1,
            "Limpiapipas (Insumo)": 1,
            "Perlitas": 1,
            "Papel Coreano": 3,
            "Papel Leche": 1,
            "Tarjeta dedicatoria": 1,
            "Tarjeta dulce": 1,
            "Tarjeta hang tag": 1,
            "Tarjeta mensaje": 1,
            "Uso": 1
        };
        State.save();
        UI.renderCartItems();
        UI.renderInsumosGrid();
        UI.renderFinancialSummary();
        Toast.show('📦 Empaque estándar cargado', 'info');
    },

    clearAllOrder() {
        State.data.cartFlowers = {};
        State.data.cartInsumos = {};
        State.save();
        UI.renderCartItems();
        UI.renderInsumosGrid();
        UI.renderFinancialSummary();
        Toast.show('Cotización vaciada', 'info');
    },

    generateProformaText() {
        const inputCliente = document.getElementById('input-cliente-nombre');
        const inputRamo = document.getElementById('input-ramo-nombre');
        const metricPrecio = document.getElementById('metric-precio-sugerido');

        const cliente = inputCliente && inputCliente.value ? inputCliente.value : "Cliente";
        const ramo = inputRamo && inputRamo.value ? inputRamo.value : "Ramo Personalizado";
        const price = metricPrecio ? metricPrecio.textContent : "S/ 0.00";

        let txt = `✨ *COTIZACIÓN ARTESANAL RUBIELLE* ✨\n`;
        txt += `💐 *Arreglo:* ${ramo}\n`;
        txt += `👤 *Cliente:* ${cliente}\n`;
        txt += `━━━━━━━━━━━━━━━━━━━\n`;
        txt += `📋 *Detalle del Pedido:*\n`;

        const items = Object.entries(State.data.cartFlowers).filter(([_, qty]) => qty > 0);
        if (items.length > 0) {
            items.forEach(([name, qty]) => {
                txt += `  • ${qty}x ${name}\n`;
            });
        } else {
            txt += `  • Sin flores seleccionadas\n`;
        }

        txt += `━━━━━━━━━━━━━━━━━━━\n`;
        txt += `🎁 *Incluye:* Empaque y tarjeta dedicatoria.\n\n`;
        txt += `💰 *PRECIO TOTAL:* *${price}*\n\n`;
        txt += `✨ *Pago del 50% para separar tu pedido.* ✨\n\n`;
        txt += `🌸 *Cada pieza es elaborada 100% a mano con amor y dedicación.* 🎨\n\n`;
        txt += `🌟 *¡Gracias por su preferencia!* 🌟`;

        const txtArea = document.getElementById('textarea-proforma');
        const linkWA = document.getElementById('link-whatsapp-send');

        if (txtArea) txtArea.value = txt;
        if (linkWA) linkWA.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`;
    },

    async copyProformaToClipboard() {
        const textarea = document.getElementById('textarea-proforma');
        if (!textarea) return;

        try {
            await navigator.clipboard.writeText(textarea.value);
            Toast.show('Proforma copiada al portapapeles', 'success');
        } catch (err) {
            textarea.select();
            document.execCommand('copy');
            Toast.show('Proforma copiada al portapapeles', 'success');
        }
    },

    printProformaPDF() {
        const inputCliente = document.getElementById('input-cliente-nombre');
        const inputRamo = document.getElementById('input-ramo-nombre');
        const metricPrecio = document.getElementById('metric-precio-sugerido');

        const cliente = inputCliente && inputCliente.value ? inputCliente.value : "Cliente General";
        const ramo = inputRamo && inputRamo.value ? inputRamo.value : "Arreglo Floral";
        const total = metricPrecio ? metricPrecio.textContent : "S/ 0.00";

        const flowersList = document.getElementById('cart-flowers-list')?.innerHTML || '';
        const insumosList = document.getElementById('cart-insumos-list')?.innerHTML || '';

        const printWindow = window.open('', '_blank', 'height=650,width=800');
        if (!printWindow) {
            Toast.show('Permite las ventanas emergentes para imprimir', 'error');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Proforma Rubielle - ${cliente}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; background: #fff; }
                        .header { border-bottom: 2px solid #be123c; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                        .header h1 { margin: 0; color: #be123c; font-size: 22px; font-weight: bold; }
                        .info { font-size: 13px; margin-bottom: 20px; color: #64748b; line-height: 1.6; }
                        .info strong { color: #0f172a; }
                        .section-title { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 15px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
                        .total-box { margin-top: 24px; text-align: right; font-size: 18px; font-weight: bold; color: #be123c; background: #fff1f2; padding: 12px 16px; border-radius: 8px; border: 1px solid #fecdd3; }
                        .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #94a3b8; font-style: italic; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Rubielle - Proforma de Cotización</h1>
                    </div>
                    <div class="info">
                        <p><strong>Cliente:</strong> ${cliente}</p>
                        <p><strong>Diseño / Ramo:</strong> ${ramo}</p>
                        <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-PE')}</p>
                    </div>
                    
                    <div class="section-title">Flores y Piezas Principales</div>
                    <div>${flowersList}</div>

                    <div class="section-title">Insumos y Empaque</div>
                    <div>${insumosList}</div>

                    <div class="total-box">
                        Precio Total del Arreglo: ${total}
                    </div>

                    <div class="footer">
                        Cada pieza es elaborada 100% a mano. Gracias por elegirnos.
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
    },

    saveOrderToHistory() {
        const inputCliente = document.getElementById('input-cliente-nombre');
        const inputRamo = document.getElementById('input-ramo-nombre');

        const cliente = inputCliente && inputCliente.value ? inputCliente.value : "Cliente General";
        const ramo = inputRamo && inputRamo.value ? inputRamo.value : "Ramo Personalizado";
        const summary = Financials.calculate();

        const itemsList = Object.entries(State.data.cartFlowers).map(([name, qty]) => `${qty}x ${name}`).join(', ');
        if (!itemsList) {
            Toast.show('Agrega al menos una pieza para registrar la venta', 'error');
            return;
        }

        const record = {
            id: Date.now(),
            fecha: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
            cliente,
            ramo,
            costoBase: summary.costoBase,
            precioVenta: summary.precioFinal,
            ganancia: summary.gananciaNeta,
            detalle: itemsList
        };

        State.data.history.unshift(record);
        State.save();
        UI.renderHistoryTable();
        Toast.show('¡Venta registrada con éxito!', 'success');
    },

    deleteHistoryRecord(recordId) {
        State.data.history = State.data.history.filter(i => i.id !== recordId);
        State.save();
        UI.renderHistoryTable();
        Toast.show('Registro eliminado del historial', 'info');
    },

    exportHistoryToCSV() {
        if (State.data.history.length === 0) {
            Toast.show('No hay datos para exportar', 'error');
            return;
        }

        let csv = 'Fecha,Cliente,Concepto,Costo Base,Precio Venta,Ganancia,Detalle\n';
        State.data.history.forEach(i => {
            csv += `"${i.fecha}","${i.cliente}","${i.ramo}",${i.costoBase},${i.precioVenta},${i.ganancia},"${i.detalle}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `rubielle_historial_ventas_${Date.now()}.csv`;
        link.click();
    },

    clearHistory() {
        if (confirm('¿Estás segura de borrar todo el historial de ventas?')) {
            State.data.history = [];
            State.save();
            UI.renderHistoryTable();
            Toast.show('Historial de ventas borrado', 'info');
        }
    },

    handleSaveItem(e) {
        e.preventDefault();
        const origId = document.getElementById('edit-item-original-id').value;
        const newItem = {
            "ID": document.getElementById('edit-item-id').value,
            "Nombre": document.getElementById('edit-item-name').value,
            "Categoría": document.getElementById('edit-item-category').value,
            "Costo Material (S/)": parseFloat(document.getElementById('edit-item-cost').value) || 0,
            "Tiempo (min)": parseInt(document.getElementById('edit-item-time').value) || 0,
            "Descripción": document.getElementById('edit-item-desc').value || ""
        };

        if (origId) {
            const idx = State.data.catalog.findIndex(i => i.ID === origId);
            if (idx !== -1) State.data.catalog[idx] = newItem;
        } else {
            State.data.catalog.unshift(newItem);
        }

        State.save();
        UI.populatePieceSelect();
        UI.renderCatalogTable();
        UI.renderInsumosGrid();
        UI.renderCartItems();
        UI.renderFinancialSummary();
        UI.closeItemModal();
        Toast.show('Material guardado en catálogo', 'success');
    },

    deleteCatalogItem(id) {
        State.data.catalog = State.data.catalog.filter(i => i.ID !== id);
        State.save();
        UI.populatePieceSelect();
        UI.renderCatalogTable();
        UI.renderInsumosGrid();
        UI.renderCartItems();
        UI.renderFinancialSummary();
        Toast.show('Elemento eliminado del catálogo', 'info');
    },

    resetDefaultCatalog() {
        if (confirm('¿Restablecer el catálogo de materiales a los valores originales?')) {
            State.data.catalog = [...State.data.defaultCatalog];
            State.save();
            UI.populatePieceSelect();
            UI.renderCatalogTable();
            UI.renderInsumosGrid();
            UI.renderCartItems();
            UI.renderFinancialSummary();
            Toast.show('Catálogo restablecido por defecto', 'info');
        }
    }
};

// MÓDULO 5: SISTEMA DE NOTIFICACIONES TOAST
const Toast = {
    show(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');

        let icon = 'fa-circle-info text-rubielle-500';
        if (type === 'success') icon = 'fa-circle-check text-emerald-500';
        if (type === 'error') icon = 'fa-triangle-exclamation text-rose-500';

        toast.className = `pointer-events-auto flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-rubielle-200 dark:border-slate-700 shadow-xl text-xs font-bold text-slate-dark dark:text-slate-100 animate-fade-in`;
        
        const iconElem = document.createElement('i');
        iconElem.className = `fa-solid ${icon}`;
        
        const textElem = document.createElement('span');
        textElem.textContent = message;

        toast.appendChild(iconElem);
        toast.appendChild(textElem);

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

// INICIALIZACIÓN DE LA APLICACIÓN
document.addEventListener('DOMContentLoaded', async () => {
    UI.initTheme();
    await State.init();
    UI.populatePieceSelect();
    UI.renderCartItems();
    UI.renderInsumosGrid();
    UI.renderCatalogTable();
    UI.renderHistoryTable();
    UI.renderFinancialSummary();
});