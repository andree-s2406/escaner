// ==================== PDF PROCESSOR MODULE ====================

// Configurar PDF.js
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    if (window.addLog) window.addLog('✅ PDF.js configurado');
}

async function processPDFs(files) {
    // ========== OBTENER REFERENCIAS A LOS ELEMENTOS ==========
    const progressWrap = document.getElementById('progressWrap');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (!progressWrap) {
        console.error("❌ No se encontró progressWrap");
        if (window.addLog) window.addLog(`❌ No se encontró progressWrap`);
        return;
    }
    
    // ========== VERIFICAR QUE window.envios SEA UN ARRAY ==========
    if (!window.envios || !Array.isArray(window.envios)) {
        console.warn("⚠️ window.envios no es un array, inicializando...");
        window.envios = [];
        if (window.loadFromStorage) {
            await window.loadFromStorage();
        }
        if (!window.envios || !Array.isArray(window.envios)) {
            window.envios = [];
        }
    }
    
    if (window.addLog) window.addLog(`📄 Procesando ${files.length} archivo(s) PDF...`);

    progressWrap.style.display = 'block';
    let totalNuevos = 0;
    let totalActualizados = 0;
    let totalDuplicados = 0;

    for (let f = 0; f < files.length; f++) {
        progressText.textContent = `📄 ${files[f].name}...`;
        if (window.addLog) window.addLog(`📖 Leyendo ${files[f].name}`);

        try {
            const arrayBuffer = await files[f].arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            if (window.addLog) window.addLog(`✅ PDF cargado: ${pdf.numPages} páginas`);
            
            let textoCompleto = '';
            
            for (let p = 1; p <= pdf.numPages; p++) {
                const pct = Math.round(((f * pdf.numPages + p) / (files.length * pdf.numPages)) * 100);
                progressFill.style.width = pct + '%';
                progressText.textContent = `📄 Página ${p}/${pdf.numPages} - ${files[f].name}`;

                const page = await pdf.getPage(p);
                const content = await page.getTextContent();
                textoCompleto += content.items.map(i => i.str).join(' ') + ' ';
            }
            
            if (window.addLog) window.addLog(`📝 Texto extraído: ${textoCompleto.length} caracteres`);
            
            // DETECTAR TIPO DE PDF
            const tipoPDF = detectarTipoPDF(textoCompleto);
            if (window.addLog) window.addLog(`🔍 Tipo de PDF detectado: ${tipoPDF}`);
            
            if (tipoPDF === 'tienda_nube') {
                // ========== PROCESAR TIENDA NUBE ==========
                const ordenes = extraerDeTiendaNube(textoCompleto);
                const nuevosEnvios = [];
                
                for (const orden of ordenes) {
                    const existe = window.envios.find(e => e.numeroInterno === orden.numero_orden);
                    if (!existe) {
                        const tnValue = orden.esShowroom ? orden.tn_especial : '';
                        
                        nuevosEnvios.push({
                            tn: tnValue,
                            numeroInterno: orden.numero_orden,
                            destinatario: orden.destinatario,
                            estado: orden.esShowroom ? 'despachado' : 'pendiente',
                            fechaCarga: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
                            fechaDespacho: orden.esShowroom ? new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : null
                        });
                        totalNuevos++;
                        if (orden.esShowroom) {
                            if (window.addLog) window.addLog(`🏢 SHOWROOM: ${orden.numero_orden} - ${orden.destinatario} - ${orden.tn_especial}`);
                        } else {
                            if (window.addLog) window.addLog(`📋 Tienda Nube: ${orden.numero_orden} - ${orden.destinatario}`);
                        }
                    } else {
                        totalDuplicados++;
                        if (window.addLog) window.addLog(`⚠ Orden ya existe: ${orden.numero_orden}`);
                    }
                }
                
                if (nuevosEnvios.length > 0 && window.addEnviosBatch) {
                    const resultado = await window.addEnviosBatch(nuevosEnvios);
                    if (window.addLog) window.addLog(`✅ Guardados: ${resultado} nuevos`);
                }
                
            } else if (tipoPDF === 'andreani') {
                // ========== PROCESAR ANDREANI ==========
                const enviosAndreani = extraerDeAndreani(textoCompleto);
                let vinculados = 0;
                
                for (const item of enviosAndreani) {
                    const pedidoExistente = window.envios.find(e => e.numeroInterno === item.numero_orden);
                    
                    if (pedidoExistente && (!pedidoExistente.tn || pedidoExistente.tn === '')) {
                        await window.actualizarEnvio(item.numero_orden, item.tn);
                        vinculados++;
                        totalActualizados++;
                        if (window.addLog) window.addLog(`🔗 Vinculado: ${item.numero_orden} -> ${item.tn}`);
                    } else if (pedidoExistente && pedidoExistente.tn === item.tn) {
                        totalDuplicados++;
                        if (window.addLog) window.addLog(`⚠ Ya vinculado: ${item.numero_orden} -> ${item.tn}`);
                    } else if (!pedidoExistente) {
                        const nuevoEnvio = {
                            tn: item.tn,
                            numeroInterno: item.numero_orden,
                            destinatario: item.destinatario,
                            estado: 'pendiente',
                            fechaCarga: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
                            fechaDespacho: null
                        };
                        if (window.addEnvio) {
                            await window.addEnvio(nuevoEnvio);
                            totalNuevos++;
                            if (window.addLog) window.addLog(`✅ Nuevo envío Andreani: ${item.numero_orden} - ${item.destinatario} - ${item.tn}`);
                        }
                    }
                }
                
                if (vinculados > 0 && window.showToast) {
                    window.showToast(`🔗 Se vincularon ${vinculados} seguimientos`, 'ok');
                }
            } else {
                if (window.addLog) window.addLog(`❌ Tipo de PDF no reconocido`);
                if (window.showToast) window.showToast('PDF no reconocido', 'err');
            }
            
        } catch (err) {
            if (window.addLog) window.addLog(`❌ Error en ${files[f].name}: ${err.message}`);
            if (window.showToast) window.showToast(`Error en ${files[f].name}: ${err.message}`, 'err');
        }
    }

    progressWrap.style.display = 'none';
    progressFill.style.width = '0%';
    
    if (window.loadFromStorage) {
        await window.loadFromStorage();
    }
    if (window.renderTable) {
        await window.renderTable();
    }
    if (window.updateStats) {
        await window.updateStats();
    }

    let mensaje = '';
    if (totalNuevos > 0) mensaje += `✓ ${totalNuevos} nuevo(s)`;
    if (totalActualizados > 0) mensaje += ` · 🔗 ${totalActualizados} vinculado(s)`;
    if (totalDuplicados > 0) mensaje += ` · ${totalDuplicados} duplicado(s)`;
    
    if (mensaje) {
        if (window.showToast) window.showToast(mensaje, 'ok');
    } else {
        if (window.showToast) window.showToast('No se encontraron datos nuevos', 'info');
    }
    
    if (window.addLog) window.addLog(`🏁 Procesamiento completado: +${totalNuevos} nuevos, ${totalActualizados} vinculados, ${totalDuplicados} duplicados`);
}

function detectarTipoPDF(texto) {
    if (!texto || typeof texto !== 'string') {
        return 'desconocido';
    }
    
    if (texto.match(/Orden\s*#\d+/i)) {
        return 'tienda_nube';
    }
    
    if (texto.match(/\b\d{15,20}\b/)) {
        return 'andreani';
    }
    
    return 'desconocido';
}

function extraerDeTiendaNube(texto) {
    if (!texto || typeof texto !== 'string') {
        console.warn("extraerDeTiendaNube: texto no válido");
        return [];
    }
    
    const resultados = [];
    const ordenesVistas = new Set();
    
    const bloques = texto.split(/Orden\s*#/i);
    
    for (let i = 1; i < bloques.length; i++) {
        const bloque = bloques[i];
        
        const matchOrden = bloque.match(/^(\d+)/);
        if (!matchOrden) continue;
        
        const numOrden = matchOrden[1];
        if (ordenesVistas.has(numOrden)) continue;
        ordenesVistas.add(numOrden);
        
        let esShowroom = false;
        let tipoRetiro = '';
        
        if (bloque.match(/Dirección\s*de\s*retiro:/i)) {
            const lineas = bloque.split('\n');
            for (let j = 0; j < lineas.length; j++) {
                const linea = lineas[j];
                if (linea.toLowerCase().includes('showrrom') || 
                    linea.toLowerCase().includes('showroom')) {
                    esShowroom = true;
                    tipoRetiro = 'Retiro en showroom';
                    break;
                }
            }
        }
        
        let destinatario = 'Desconocido';
        
        const matchEntregar = bloque.match(/Entregar\s*a:\s*([^\n]+)/i);
        if (matchEntregar) {
            destinatario = matchEntregar[1].trim();
        } else {
            const matchEnviar = bloque.match(/Enviar\s*a:\s*([^\n]+)/i);
            if (matchEnviar) {
                destinatario = matchEnviar[1].trim();
            } else {
                const lineas = bloque.split('\n');
                for (let j = 0; j < lineas.length; j++) {
                    const linea = lineas[j];
                    if (linea.toLowerCase().includes('entregar a:')) {
                        const partes = linea.split(/entregar\s*a:/i);
                        if (partes[1] && partes[1].trim()) {
                            destinatario = partes[1].trim();
                            break;
                        }
                        if (j + 1 < lineas.length && lineas[j + 1].trim()) {
                            destinatario = lineas[j + 1].trim();
                            break;
                        }
                    }
                    if (linea.toLowerCase().includes('enviar a:')) {
                        const partes = linea.split(/enviar\s*a:/i);
                        if (partes[1] && partes[1].trim()) {
                            destinatario = partes[1].trim();
                            break;
                        }
                        if (j + 1 < lineas.length && lineas[j + 1].trim()) {
                            destinatario = lineas[j + 1].trim();
                            break;
                        }
                    }
                }
            }
        }
        
        destinatario = destinatario.replace(/Tel[ée]fono[:\s]*.*$/i, '').trim();
        destinatario = destinatario.replace(/\d{6,}.*$/, '').trim();
        
        if (!destinatario || destinatario.length < 3) {
            destinatario = 'Desconocido';
        }
        
        if (esShowroom) {
            resultados.push({
                numero_orden: `#${numOrden}`,
                destinatario: destinatario,
                esShowroom: true,
                tn_especial: tipoRetiro
            });
            if (window.addLog) window.addLog(`🏢 Tienda Nube (SHOWROOM): #${numOrden} - ${destinatario} - ${tipoRetiro}`);
        } else {
            resultados.push({
                numero_orden: `#${numOrden}`,
                destinatario: destinatario,
                esShowroom: false,
                tn_especial: null
            });
            if (window.addLog) window.addLog(`📋 Tienda Nube: #${numOrden} - ${destinatario}`);
        }
    }
    
    return resultados;
}

function extraerDeAndreani(texto) {
    if (!texto || typeof texto !== 'string') {
        console.warn("extraerDeAndreani: texto no válido");
        return [];
    }
    
    const resultados = [];
    const tnVistos = new Set();
    
    const tnRegex = /\b(\d{15,20})\b/g;
    const tnMatches = [...texto.matchAll(tnRegex)];
    
    if (window.addLog) window.addLog(`📊 Encontrados ${tnMatches.length} números de seguimiento`);
    
    for (const tnMatch of tnMatches) {
        const tn = tnMatch[1];
        
        if (tnVistos.has(tn)) continue;
        tnVistos.add(tn);
        
        const index = tnMatch.index;
        const inicio = Math.max(0, index - 500);
        const fin = Math.min(texto.length, index + 500);
        const contexto = texto.substring(inicio, fin);
        
        let numeroOrden = '—';
        const ordenMatch = contexto.match(/#(\d{4,10})/);
        if (ordenMatch) {
            numeroOrden = `#${ordenMatch[1]}`;
        }
        
        let destinatario = 'Desconocido';
        const patrones = [
            /Entregar\s*a:\s*([A-Za-zÁÉÍÓÚÑáéíóúñ\s\.]+?)(?:\n|Tel|$)/i,
            /Enviar\s*a:\s*([A-Za-zÁÉÍÓÚÑáéíóúñ\s\.]+?)(?:\n|Tel|$)/i,
            /Destinatario[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ\s\.]+?)(?:\n|Tel|$)/i,
            /Cliente[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ\s\.]+?)(?:\n|Tel|$)/i
        ];
        
        for (const patron of patrones) {
            const match = contexto.match(patron);
            if (match && match[1]) {
                destinatario = match[1].trim();
                break;
            }
        }
        
        destinatario = destinatario.replace(/Tel[ée]fono.*$/i, '').trim();
        destinatario = destinatario.replace(/\d{6,}.*$/, '').trim();
        
        if (!destinatario || destinatario.length < 3) {
            destinatario = 'Desconocido';
        }
        
        resultados.push({
            tn: tn,
            numero_orden: numeroOrden,
            destinatario: destinatario
        });
        
        if (window.addLog) window.addLog(`🚚 Andreani: ${numeroOrden} - ${destinatario} - ${tn}`);
    }
    
    return resultados;
}

function extractAndreaniData(texto) {
    const envios = extraerDeAndreani(texto);
    return envios.map(e => ({
        id: Date.now() + Math.random() + Math.random(),
        tn: e.tn,
        numeroInterno: e.numero_orden,
        destinatario: e.destinatario,
        estado: 'pendiente',
        fechaCarga: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
        fechaDespacho: null
    }));
}

// Exportar funciones globales
window.processPDFs = processPDFs;
window.extractAndreaniData = extractAndreaniData;
window.detectarTipoPDF = detectarTipoPDF;
window.extraerDeTiendaNube = extraerDeTiendaNube;
window.extraerDeAndreani = extraerDeAndreani;