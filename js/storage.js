// ==================== STORAGE MODULE ====================
const STORAGE_KEY = 'andreani_envios_v4';

// Variables globales
window.envios = [];
window.currentFilter = 'all';

// Función para agregar logs (será sobrescrita por uiController)
window.addLog = function(msg) {
    console.log(msg);
};

function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const data = stored ? JSON.parse(stored) : [];
        if (window.addLog) window.addLog(`📦 Cargados ${data.length} envíos del storage`);
        return data;
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error loading: ${error}`);
        return [];
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.envios));
        if (window.addLog) window.addLog(`💾 Guardados ${window.envios.length} envíos`);
    } catch (error) {
        if (window.addLog) window.addLog(`❌ Error saving: ${error}`);
    }
}

function addEnvio(envioData) {
    const existe = window.envios.find(x => x.tn === envioData.tn);
    if (!existe) {
        window.envios.push(envioData);
        saveToStorage();
        if (window.addLog) window.addLog(`➕ Nuevo envío: ${envioData.numeroInterno} - ${envioData.destinatario}`);
        return true;
    }
    if (window.addLog) window.addLog(`⚠ Duplicado: ${envioData.tn}`);
    return false;
}

function deleteEnvio(id) {
    window.envios = window.envios.filter(e => String(e.id) !== String(id));
    saveToStorage();
    if (window.addLog) window.addLog(`🗑 Eliminado envío ID: ${id}`);
}

function resetAllDispatched() {
    let count = 0;
    window.envios.forEach(e => {
        if (e.estado === 'despachado') {
            e.estado = 'pendiente';
            e.fechaDespacho = null;
            count++;
        }
    });
    if (count > 0) saveToStorage();
    if (window.addLog) window.addLog(`↩ Reseteados ${count} envíos despachados`);
    return count;
}

function clearAllEnvios() {
    window.envios = [];
    saveToStorage();
    if (window.addLog) window.addLog(`🗑 Base de datos limpiada`);
}

function getFilteredEnvios() {
    if (window.currentFilter === 'pending') return window.envios.filter(e => e.estado === 'pendiente');
    if (window.currentFilter === 'dispatched') return window.envios.filter(e => e.estado === 'despachado');
    return window.envios;
}

// Exportar funciones globales
window.loadFromStorage = loadFromStorage;
window.saveToStorage = saveToStorage;
window.addEnvio = addEnvio;
window.deleteEnvio = deleteEnvio;
window.resetAllDispatched = resetAllDispatched;
window.clearAllEnvios = clearAllEnvios;
window.getFilteredEnvios = getFilteredEnvios;