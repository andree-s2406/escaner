// ==================== APP MODULE - INICIALIZACIÓN ====================

function setupEventListeners() {
    if (window.addLog) window.addLog(`🔧 Configurando event listeners...`);
    
    const pdfInput = document.getElementById('pdfInput');
    if (pdfInput) {
        pdfInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length && window.processPDFs) window.processPDFs(files);
            e.target.value = '';
        });
    }
    
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            if (files.length && window.processPDFs) window.processPDFs(files);
        });
    }
    
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
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.getAttribute('data-filter');
            if (filter && window.setFilter) window.setFilter(filter);
        });
    });
    
    const exportBtn = document.getElementById('exportBtn');
    const resetDispatchedBtn = document.getElementById('resetDispatchedBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const confirmModalBtn = document.getElementById('confirmModalBtn');
    
    if (exportBtn) exportBtn.addEventListener('click', window.exportCSV);
    if (resetDispatchedBtn) resetDispatchedBtn.addEventListener('click', window.resetDispatched);
    if (clearAllBtn) clearAllBtn.addEventListener('click', window.confirmClearAll);
    
    // Modal handlers
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', () => {
            const modal = document.getElementById('confirmModal');
            if (modal) modal.classList.remove('open');
        });
    }
    
    if (confirmModalBtn) {
        confirmModalBtn.addEventListener('click', () => {
            const modal = document.getElementById('confirmModal');
            if (modal) modal.classList.remove('open');
        });
    }
    
    if (window.addLog) window.addLog(`✅ Event listeners configurados`);
}

function initApp() {
    if (window.addLog) window.addLog(`🚀 Inicializando aplicación...`);
    
    // Cargar datos
    if (window.loadFromStorage) {
        window.envios = window.loadFromStorage();
    }
    window.currentFilter = 'all';
    
    // Renderizar UI
    if (window.renderTable) window.renderTable();
    if (window.updateStats) window.updateStats();
    
    // Configurar eventos
    setupEventListeners();
    
    // Enfocar input
    const scanInput = document.getElementById('scanInput');
    if (scanInput) scanInput.focus();
    
    if (window.addLog) window.addLog(`✅ Aplicación inicializada con ${window.envios.length} envíos`);
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}