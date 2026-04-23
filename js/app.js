// App Module - Inicialización con API

async function initApp() {
    if (window.addLog) window.addLog(`🚀 Inicializando aplicación...`);
    
    // Limpiar envíos antiguos (solo una vez por día)
    const ultimaLimpieza = localStorage.getItem('ultima_limpieza');
    const hoy = new Date().toDateString();
    
    if (ultimaLimpieza !== hoy) {
        if (window.limpiarEnviosAntiguos) {
            await window.limpiarEnviosAntiguos();
            localStorage.setItem('ultima_limpieza', hoy);
        }
    }
    
    // Cargar datos (por defecto últimos 7 días)
    await window.loadFromStorage();
    
    window.currentFilter = 'all';
    
    await window.renderTable();
    await window.updateStats();
    
    setupEventListeners();
    
    const scanInput = document.getElementById('scanInput');
    if (scanInput) scanInput.focus();
    
    if (window.addLog) window.addLog(`✅ Aplicación inicializada con ${window.envios.length} envíos`);
}

function setupEventListeners() {
    if (window.addLog) window.addLog(`🔧 Configurando event listeners...`);
    
    // PDF Input
    const pdfInput = document.getElementById('pdfInput');
    if (pdfInput) {
        const newInput = pdfInput.cloneNode(true);
        pdfInput.parentNode.replaceChild(newInput, pdfInput);
        
        newInput.addEventListener('change', (e) => {
            if (e.target.files.length && window.processPDFs) {
                window.processPDFs(Array.from(e.target.files));
            }
            e.target.value = '';
        });
    }
    
    // Dropzone
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
        const newDropzone = dropzone.cloneNode(true);
        dropzone.parentNode.replaceChild(newDropzone, dropzone);
        
        newDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            newDropzone.classList.add('drag-over');
        });
        
        newDropzone.addEventListener('dragleave', () => {
            newDropzone.classList.remove('drag-over');
        });
        
        newDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            newDropzone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            if (files.length && window.processPDFs) {
                window.processPDFs(files);
            }
        });
        
        const input = newDropzone.querySelector('input');
        if (input) {
            newDropzone.addEventListener('click', (e) => {
                if (e.target !== input) {
                    input.click();
                }
            });
        }
    }
    
    // Escáner
    const startScannerBtn = document.getElementById('startScannerBtn');
    const stopScannerBtn = document.getElementById('stopScannerBtn');
    const manualScanBtn = document.getElementById('manualScanBtn');
    const scanInput = document.getElementById('scanInput');
    
    if (startScannerBtn && window.startScanner) startScannerBtn.addEventListener('click', window.startScanner);
    if (stopScannerBtn && window.stopScanner) stopScannerBtn.addEventListener('click', window.stopScanner);
    if (manualScanBtn && window.manualScan) manualScanBtn.addEventListener('click', window.manualScan);
    if (scanInput) scanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && window.manualScan) window.manualScan();
    });
    
    // Filtros de estado
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.getAttribute('data-filter');
            if (filter && window.setFilter) window.setFilter(filter);
        });
    });
    
    // Filtros de período
    document.querySelectorAll('[data-periodo]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const dias = parseInt(e.target.getAttribute('data-periodo'));
            
            document.querySelectorAll('[data-periodo]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            if (window.setFiltroDias) {
                await window.setFiltroDias(dias);
            }
        });
    });
    
    // Acciones
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', window.exportCSV);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}