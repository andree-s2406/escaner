// ==================== BARCODE SCANNER MODULE CON QUAGGA ====================
let scannerActive = false;

function addLog(msg) {
    console.log(msg);
    const logPanel = document.getElementById('logPanel');
    if (logPanel) {
        const time = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${time}] ${msg}`;
        logEntry.style.fontFamily = 'monospace';
        logEntry.style.fontSize = '10px';
        logEntry.style.borderBottom = '1px solid #333';
        logEntry.style.padding = '2px 0';
        logPanel.appendChild(logEntry);
        logPanel.scrollTop = logPanel.scrollHeight;
        
        while (logPanel.children.length > 100) {
            logPanel.removeChild(logPanel.children[0]);
        }
    }
}

function startScanner() {
    addLog(`🎥 Iniciando escáner con Quagga...`);
    
    // Verificar que Quagga esté cargado
    if (typeof Quagga === 'undefined') {
        addLog(`❌ Quagga no está cargado. Verificar CDN.`);
        showToast('Error: Biblioteca de escáner no cargada', 'err');
        return;
    }
    
    // Detener cualquier instancia anterior
    if (scannerActive) {
        stopScanner();
    }
    
    // Configurar Quagga
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#interactive'),
            constraints: {
                width: { min: 640 },
                height: { min: 480 },
                facingMode: "environment",
                aspectRatio: { min: 1, max: 2 }
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: 2,
        decoder: {
            readers: [
                "code_128_reader",
                "ean_reader", 
                "ean_8_reader",
                "code_39_reader",
                "code_93_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader"
            ]
        },
        locate: true
    }, function(err) {
        if (err) {
            addLog(`❌ Error al iniciar Quagga: ${err}`);
            showToast('Error al iniciar la cámara', 'err');
            return;
        }
        
        addLog(`✅ Quagga inicializado correctamente`);
        Quagga.start();
        scannerActive = true;
        showToast('📷 Escáner iniciado. Apunte al código de barras.', 'ok');
        
        const startBtn = document.getElementById('startScannerBtn');
        if (startBtn) startBtn.classList.add('active');
    });
    
    // Detectar códigos escaneados
    Quagga.onDetected(function(result) {
        if (!scannerActive) return;
        
        const code = result.codeResult.code;
        addLog(`📸 Escaneado: ${code}`);
        processScannedBarcode(code);
        
        // Pequeña vibración si el dispositivo lo soporta
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
    });
}

function stopScanner() {
    if (Quagga && scannerActive) {
        Quagga.stop();
        scannerActive = false;
        addLog(`⏹ Escáner detenido`);
        showToast('Escáner detenido', 'info');
        
        const startBtn = document.getElementById('startScannerBtn');
        if (startBtn) startBtn.classList.remove('active');
        
        const interactive = document.getElementById('interactive');
        if (interactive) {
            interactive.innerHTML = '';
        }
    }
}

async function processScannedBarcode(barcode) {
    if (!barcode) {
        addLog(`⚠ Código vacío escaneado`);
        return;
    }
    
    const cleanBarcode = String(barcode).replace(/[\s-]/g, '');
    addLog(`🔍 Procesando código: ${cleanBarcode}`);
    
    if (!window.envios) {
        addLog(`❌ window.envios no está definido`);
        return;
    }
    
    const envio = window.envios.find(e => e.tn === cleanBarcode);
    
    if (!envio) {
        addLog(`❌ Código no encontrado: ${cleanBarcode}`);
        showToast(`❌ Código ${cleanBarcode} no encontrado`, 'err');
        return;
    }
    
    if (envio.estado === 'despachado') {
        addLog(`⚠ Ya despachado: ${envio.numeroInterno}`);
        showToast(`⚠ ${envio.numeroInterno} ya fue despachado`, 'info');
        return;
    }
    
    try {
        addLog(`🔄 Llamando a API para despachar: ${cleanBarcode}`);
        
        // Usar el método de API (rutas relativas)
        const result = await API.despacharEnvio(cleanBarcode);
        
        if (result && result.success !== false) {
            envio.estado = 'despachado';
            envio.fechaDespacho = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
            
            if (window.loadFromStorage) await window.loadFromStorage();
            if (window.renderTable) await window.renderTable();
            if (window.updateStats) await window.updateStats();
            
            setTimeout(() => {
                const row = document.querySelector(`tr[data-id="${envio.id}"]`);
                if (row) {
                    row.classList.add('flash-row');
                    setTimeout(() => row.classList.remove('flash-row'), 1300);
                }
            }, 50);
            
            addLog(`✅ Despachado: ${envio.numeroInterno} - ${envio.destinatario}`);
            showToast(`✓ Despachado: ${envio.numeroInterno} — ${envio.destinatario}`, 'ok');
        } else {
            throw new Error(result?.error || 'Error al despachar');
        }
    } catch (error) {
        addLog(`❌ Error al despachar: ${error.message}`);
        showToast(`Error al despachar: ${error.message}`, 'err');
    }
}

function manualScan() {
    const input = document.getElementById('scanInput');
    if (!input) return;
    
    const valor = input.value.trim().replace(/\s/g, '');
    
    if (!valor) {
        showToast('Ingrese un número de seguimiento', 'err');
        return;
    }
    
    processScannedBarcode(valor);
    input.value = '';
    input.focus();
}

// Exportar funciones globales
window.startScanner = startScanner;
window.stopScanner = stopScanner;
window.manualScan = manualScan;
window.processScannedBarcode = processScannedBarcode;