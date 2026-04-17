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
    let totalDuplicados = 0;

    for (let f = 0; f < files.length; f++) {
        progressText.textContent = `📄 ${files[f].name}...`;
        if (window.addLog) window.addLog(`📖 Leyendo ${files[f].name}`);

        try {
            const arrayBuffer = await files[f].arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            if (window.addLog) window.addLog(`✅ PDF cargado: ${pdf.numPages} páginas`);

            for (let p = 1; p <= pdf.numPages; p++) {
                const pct = Math.round(((f * pdf.numPages + p) / (files.length * pdf.numPages)) * 100);
                progressFill.style.width = pct + '%';
                progressText.textContent = `📄 Página ${p}/${pdf.numPages} - ${files[f].name}`;

                const page = await pdf.getPage(p);
                const content = await page.getTextContent();
                const textoCompleto = content.items.map(i => i.str).join(' ');
                
                if (window.addLog) window.addLog(`🔍 Página ${p}: ${textoCompleto.length} caracteres extraídos`);
                
                if (p === 1 && f === 0 && window.addLog) {
                    window.addLog(`📝 Preview texto: "${textoCompleto.substring(0, 200)}..."`);
                }

                const encontrados = extractAndreaniData(textoCompleto);
                if (window.addLog) window.addLog(`🎯 Encontrados ${encontrados.length} envíos en página ${p}`);
                
                for (const e of encontrados) {
                    const agregado = window.addEnvio(e);
                    if (agregado) {
                        totalNuevos++;
                        if (window.addLog) window.addLog(`✅ Nuevo: ${e.numeroInterno} - ${e.destinatario}`);
                    } else {
                        totalDuplicados++;
                    }
                }
            }
        } catch (err) {
            if (window.addLog) window.addLog(`❌ Error en ${files[f].name}: ${err.message}`);
            if (window.showToast) window.showToast(`Error en ${files[f].name}: ${err.message}`, 'err');
        }
    }

    progressWrap.style.display = 'none';
    progressFill.style.width = '0%';

    if (window.renderTable) window.renderTable();
    if (window.updateStats) window.updateStats();

    if (totalNuevos > 0) {
        if (window.showToast) window.showToast(`✓ ${totalNuevos} envío(s) cargados${totalDuplicados ? ` · ${totalDuplicados} duplicados omitidos` : ''}`, 'ok');
    } else if (totalDuplicados > 0) {
        if (window.showToast) window.showToast(`Todos los envíos ya existen (${totalDuplicados} duplicados)`, 'info');
    } else {
        if (window.showToast) window.showToast('No se encontraron etiquetas Andreani en el PDF', 'err');
    }
    
    if (window.addLog) window.addLog(`🏁 Procesamiento completado: +${totalNuevos} nuevos, ${totalDuplicados} duplicados`);
}

function extractAndreaniData(texto) {
    const resultados = [];
    
    if (window.addLog) window.addLog(`🔎 Buscando patrones Andreani...`);
    
    // Buscar números de seguimiento (15-20 dígitos)
    const tnRegex = /\b(\d{15,20})\b/g;
    const tnMatches = [...texto.matchAll(tnRegex)];
    
    if (window.addLog) window.addLog(`📊 Encontrados ${tnMatches.length} posibles números de seguimiento`);
    
    for (const tnMatch of tnMatches) {
        const tn = tnMatch[1];
        const index = tnMatch.index;
        
        // Buscar contexto alrededor del número
        const inicio = Math.max(0, index - 300);
        const fin = Math.min(texto.length, index + 200);
        const contexto = texto.substring(inicio, fin);
        
        // Buscar destinatario
        let destinatario = 'Desconocido';
        const destRegex = /Destinatario[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ\s]+)/i;
        const destMatch = contexto.match(destRegex);
        if (destMatch) {
            destinatario = destMatch[1].trim();
            if (window.addLog) window.addLog(`👤 Destinatario encontrado: ${destinatario}`);
        }
        
        // Buscar número interno
        let numeroInterno = '—';
        const internoRegex = /N[°º]\s*[Ii]nterno[:\s]+#?(\d+)/i;
        const internoMatch = contexto.match(internoRegex);
        if (internoMatch) {
            numeroInterno = '#' + internoMatch[1];
            if (window.addLog) window.addLog(`🔢 N° Interno encontrado: ${numeroInterno}`);
        }
        
        if (tn && tn.length >= 10) {
            resultados.push({
                id: Date.now() + Math.random() + Math.random(),
                tn: tn,
                numeroInterno: numeroInterno,
                destinatario: destinatario,
                estado: 'pendiente',
                fechaCarga: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
                fechaDespacho: null
            });
        }
    }
    
    if (window.addLog) window.addLog(`✅ Extraídos ${resultados.length} envíos válidos`);
    return resultados;
}

// Exportar funciones globales
window.processPDFs = processPDFs;
window.extractAndreaniData = extractAndreaniData;