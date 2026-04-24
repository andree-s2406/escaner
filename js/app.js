// App Module - Inicialización con API

async function initApp() {
    
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
    
}

function setupEventListeners() {
    
    // PDF Input
    const pdfInput = document.getElementById('pdfInput');
    if (pdfInput) {
        pdfInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length && window.processPDFs) {
                window.processPDFs(Array.from(e.target.files));
                e.target.value = ''; // Limpiar después de procesar
            }
        });
    }
    
    // Dropzone
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('drag-over');
        });
        
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            if (files.length && window.processPDFs) {
                window.processPDFs(files);
            }
        });
        
        dropzone.addEventListener('click', (e) => {
            const input = dropzone.querySelector('input[type="file"]');
            if (input && e.target !== input) {
                input.click();
            }
        });
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