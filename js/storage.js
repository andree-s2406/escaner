// ==================== STORAGE MODULE CON API ====================

// Variables globales
window.envios = [];
window.currentFilter = 'all';

window.addLog = function(msg) {
    console.log(msg);
};

// Cargar desde la API
async function loadFromStorage() {
    try {
        const data = await API.getEnvios();
        window.envios = data;
        if (window.addLog) window.addLog(`📦 Cargados ${window.envios.length} envíos desde la API`);
        return window.envios;
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error cargando desde API: ${error}`);
        return [];
    }
}

// Guardar en la API (placeholder)
async function saveToStorage() {
    if (window.addLog) window.addLog(`💾 Datos sincronizados con la API`);
}

// Agregar envío usando la API
async function addEnvio(envioData) {
    try {
        const nuevo = await API.createEnvio(envioData);
        window.envios.push(nuevo);
        if (window.addLog) window.addLog(`➕ Nuevo envío: ${nuevo.numeroInterno} - ${nuevo.destinatario}`);
        return true;
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error al agregar: ${error.message}`);
        return false;
    }
}

// Agregar múltiples envíos en batch
async function addEnviosBatch(enviosData) {
    try {
        const result = await API.createEnviosBatch(enviosData);
        await loadFromStorage();
        if (window.addLog) window.addLog(`✅ Agregados: ${result.nuevos}, Duplicados: ${result.duplicados}`);
        return result.nuevos;
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error en batch: ${error.message}`);
        return 0;
    }
}

async function despacharEnvio(numero_interno, tn) {
    try {
        const envioActualizado = await API.despacharEnvio(numero_interno, tn);
        const index = window.envios.findIndex(e => e.numeroInterno === numero_interno);
        if (index !== -1) {
            window.envios[index] = envioActualizado;
        }
        if (window.addLog) window.addLog(`✅ Despachado: ${numero_interno} -> ${tn}`);
        return true;
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error al despachar: ${error.message}`);
        return false;
    }
}
async function actualizarEnvio(numero_interno, tn) {
    try {
        // Limpiar aquí también
        const numeroLimpio = String(numero_interno).replace('#', '');
        
        const envioActualizado = await API.actualizarEnvio(numeroLimpio, tn);
        
        const index = window.envios.findIndex(e => e.numeroInterno === numero_interno);
        if (index !== -1) {
            window.envios[index] = envioActualizado;
        }
        
        if (window.addLog) window.addLog(`✅ Actualizado: ${numero_interno} -> ${tn}`);
        return true;
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error al actualizar: ${error.message}`);
        return false;
    }
}

window.actualizarEnvio = actualizarEnvio;
// Eliminar envío usando la API
async function deleteEnvio(id) {
    try {
        await API.deleteEnvio(id);
        window.envios = window.envios.filter(e => e.id !== id);
        if (window.addLog) window.addLog(`🗑 Eliminado envío ID: ${id}`);
        return true;
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error al eliminar: ${error.message}`);
        return false;
    }
}

// Resetear despachados usando la API
async function resetAllDispatched() {
    try {
        const count = await API.resetDespachados();
        await loadFromStorage();
        if (window.addLog) window.addLog(`↩ Reseteados ${count} envíos despachados`);
        return count;
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error al resetear: ${error.message}`);
        return 0;
    }
}

// Limpiar todos usando la API
async function clearAllEnvios() {
    try {
        await API.clearAll();
        window.envios = [];
        if (window.addLog) window.addLog(`🗑 Base de datos limpiada`);
        return true;
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error al limpiar: ${error.message}`);
        return false;
    }
}

function getFilteredEnvios() {
    if (window.currentFilter === 'pending') return window.envios.filter(e => e.estado === 'pendiente');
    if (window.currentFilter === 'dispatched') return window.envios.filter(e => e.estado === 'despachado');
    return window.envios;
}

// ============ NUEVA FUNCIÓN ============
async function updateStatsFromAPI() {
    try {
        const stats = await API.getStats();
        return stats;
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error obteniendo stats: ${error.message}`);
        return { total: 0, pendientes: 0, despachados: 0 };
    }
}

// Exportar funciones globales
window.loadFromStorage = loadFromStorage;
window.saveToStorage = saveToStorage;
window.addEnvio = addEnvio;
window.addEnviosBatch = addEnviosBatch;
window.despacharEnvio = despacharEnvio;
window.deleteEnvio = deleteEnvio;
window.resetAllDispatched = resetAllDispatched;
window.clearAllEnvios = clearAllEnvios;
window.getFilteredEnvios = getFilteredEnvios;
window.updateStatsFromAPI = updateStatsFromAPI;