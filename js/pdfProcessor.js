// ==================== PDF PROCESSOR MODULE ====================

// Configurar PDF.js
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    if (window.addLog) window.addLog('✅ PDF.js configurado');
}

async function processPDFs(files) {
    if (window.addLog) window.addLog(`📄 Procesando ${files.length} archivo(s) PDF...`);
    
    const progressWrap = document.getElementById('progressWrap');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (!progressWrap) {
        if (window.addLog) window.addLog(`❌ No se encontró progressWrap`);
        return;
    }

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
                // Procesar como Tienda Nube
                const ordenes = extraerDeTiendaNube(textoCompleto);
                
                for (const orden of ordenes) {
                    const existe = window.envios.find(e => e.numeroInterno === orden.numero_orden);
                    if (!existe) {
                        const nuevoEnvio = {
                            id: Date.now() + Math.random() + Math.random(),
                            tn: '',
                            numeroInterno: orden.numero_orden,
                            destinatario: orden.destinatario,
                            estado: 'pendiente',
                            fechaCarga: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
                            fechaDespacho: null
                        };
                        window.envios.push(nuevoEnvio);
                        totalNuevos++;
                        if (window.addLog) window.addLog(`✅ Nueva orden: ${orden.numero_orden} - ${orden.destinatario}`);
                    } else {
                        totalDuplicados++;
                        if (window.addLog) window.addLog(`⚠ Orden ya existe: ${orden.numero_orden}`);
                    }
                }
            } else if (tipoPDF === 'andreani') {
                // Procesar como Andreani
                const enviosAndreani = extraerDeAndreani(textoCompleto);
                
                for (const envio of enviosAndreani) {
                    // Buscar si ya existe un envío con ese número de orden
                    const existente = window.envios.find(e => e.numeroInterno === envio.numero_orden);
                    
                    if (existente) {
                        // ACTUALIZAR el registro existente
                        if (!existente.tn || existente.tn === '') {
                            existente.tn = envio.tn;
                            totalActualizados++;
                            if (window.addLog) window.addLog(`🔗 Vinculado: ${envio.numero_orden} -> ${envio.tn}`);
                        } else if (existente.tn === envio.tn) {
                            totalDuplicados++;
                            if (window.addLog) window.addLog(`⚠ TN ya existe: ${envio.tn}`);
                        } else {
                            // Si tiene un TN diferente, crear nuevo
                            const yaExisteTN = window.envios.find(e => e.tn === envio.tn);
                            if (!yaExisteTN) {
                                const nuevoEnvio = {
                                    id: Date.now() + Math.random() + Math.random(),
                                    tn: envio.tn,
                                    numeroInterno: envio.numero_orden,
                                    destinatario: envio.destinatario,
                                    estado: 'pendiente',
                                    fechaCarga: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
                                    fechaDespacho: null
                                };
                                window.envios.push(nuevoEnvio);
                                totalNuevos++;
                                if (window.addLog) window.addLog(`✅ Nuevo (TN diferente): ${envio.numero_orden} - ${envio.tn}`);
                            } else {
                                totalDuplicados++;
                                if (window.addLog) window.addLog(`⚠ TN duplicado: ${envio.tn}`);
                            }
                        }
                    } else {
                        // CREAR NUEVO registro
                        const yaExisteTN = window.envios.find(e => e.tn === envio.tn);
                        if (!yaExisteTN) {
                            const nuevoEnvio = {
                                id: Date.now() + Math.random() + Math.random(),
                                tn: envio.tn,
                                numeroInterno: envio.numero_orden,
                                destinatario: envio.destinatario,
                                estado: 'pendiente',
                                fechaCarga: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
                                fechaDespacho: null
                            };
                            window.envios.push(nuevoEnvio);
                            totalNuevos++;
                            if (window.addLog) window.addLog(`✅ Nuevo envío Andreani: ${envio.numero_orden} - ${envio.destinatario} - ${envio.tn}`);
                        } else {
                            totalDuplicados++;
                            if (window.addLog) window.addLog(`⚠ TN duplicado: ${envio.tn}`);
                        }
                    }
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
    
    if (window.saveToStorage) window.saveToStorage();
    if (window.renderTable) window.renderTable();
    if (window.updateStats) window.updateStats();

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
    // Detectar Tienda Nube: contiene "Orden #"
    if (texto.match(/Orden\s*#\d+/i)) {
        return 'tienda_nube';
    }
    
    // Detectar Andreani: contiene números de 15-20 dígitos
    if (texto.match(/\b\d{15,20}\b/)) {
        return 'andreani';
    }
    
    return 'desconocido';
}

function extraerDeTiendaNube(texto) {
    const resultados = [];
    const ordenesVistas = new Set();
    
    // Dividir por "Orden #" para procesar cada orden por separado
    const bloques = texto.split(/Orden\s*#/i);
    
    for (let i = 1; i < bloques.length; i++) {
        const bloque = bloques[i];
        
        // Extraer número de orden (primeros dígitos del bloque)
        const matchOrden = bloque.match(/^(\d+)/);
        if (!matchOrden) continue;
        
        const numOrden = matchOrden[1];
        if (ordenesVistas.has(numOrden)) continue;
        ordenesVistas.add(numOrden);
        
        // Buscar "Entregar a:" o "Enviar a:" en el bloque
        let destinatario = 'Desconocido';
        
        // Patrón 1: "Entregar a: Nombre"
        const matchEntregar = bloque.match(/Entregar\s*a:\s*([^\n]+)/i);
        if (matchEntregar) {
            destinatario = matchEntregar[1].trim();
        } else {
            // Patrón 2: "Enviar a: Nombre"
            const matchEnviar = bloque.match(/Enviar\s*a:\s*([^\n]+)/i);
            if (matchEnviar) {
                destinatario = matchEnviar[1].trim();
            } else {
                // Buscar en líneas
                const lineas = bloque.split('\n');
                for (let j = 0; j < lineas.length; j++) {
                    const linea = lineas[j];
                    
                    // Buscar "Entregar a:"
                    if (linea.toLowerCase().includes('entregar a:')) {
                        const partes = linea.split(/entregar\s*a:/i);
                        if (partes[1] && partes[1].trim()) {
                            destinatario = partes[1].trim();
                            break;
                        }
                        // O en la siguiente línea
                        if (j + 1 < lineas.length && lineas[j + 1].trim()) {
                            destinatario = lineas[j + 1].trim();
                            break;
                        }
                    }
                    
                    // Buscar "Enviar a:"
                    if (linea.toLowerCase().includes('enviar a:')) {
                        const partes = linea.split(/enviar\s*a:/i);
                        if (partes[1] && partes[1].trim()) {
                            destinatario = partes[1].trim();
                            break;
                        }
                        // O en la siguiente línea
                        if (j + 1 < lineas.length && lineas[j + 1].trim()) {
                            destinatario = lineas[j + 1].trim();
                            break;
                        }
                    }
                }
            }
        }
        
        // Limpiar destinatario (quitar teléfono si aparece)
        destinatario = destinatario.replace(/Tel[ée]fono[:\s]*.*$/i, '').trim();
        destinatario = destinatario.replace(/\d{6,}.*$/, '').trim();
        
        // Si el destinatario está vacío o muy corto, usar "Desconocido"
        if (!destinatario || destinatario.length < 3) {
            destinatario = 'Desconocido';
        }
        
        resultados.push({
            numero_orden: `#${numOrden}`,
            destinatario: destinatario
        });
        
        if (window.addLog) window.addLog(`📋 Tienda Nube: #${numOrden} - ${destinatario}`);
    }
    
    return resultados;
}

function extraerDeAndreani(texto) {
    const resultados = [];
    const tnVistos = new Set();
    
    // Buscar todos los números de seguimiento (15-20 dígitos)
    const tnRegex = /\b(\d{15,20})\b/g;
    const tnMatches = [...texto.matchAll(tnRegex)];
    
    if (window.addLog) window.addLog(`📊 Encontrados ${tnMatches.length} números de seguimiento`);
    
    for (const tnMatch of tnMatches) {
        const tn = tnMatch[1];
        
        if (tnVistos.has(tn)) continue;
        tnVistos.add(tn);
        
        const index = tnMatch.index;
        
        // Extraer contexto (500 caracteres alrededor)
        const inicio = Math.max(0, index - 500);
        const fin = Math.min(texto.length, index + 500);
        const contexto = texto.substring(inicio, fin);
        
        // Buscar número de orden en el contexto (formato #5530)
        let numeroOrden = '—';
        const ordenMatch = contexto.match(/#(\d{4,10})/);
        if (ordenMatch) {
            numeroOrden = `#${ordenMatch[1]}`;
        }
        
        // Buscar destinatario en el contexto
        let destinatario = 'Desconocido';
        
        // Patrones para destinatario en etiquetas Andreani
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
        
        // Limpiar destinatario
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

// Mantener compatibilidad con código existente
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