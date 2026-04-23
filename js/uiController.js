// ==================== UI CONTROLLER MODULE ====================

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function renderTable() {
    if (window.addLog) window.addLog(`🔄 Renderizando tabla...`);
    
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('mainTable');
    const visibleCount = document.getElementById('visibleCount');

    if (!tbody) return;

    const filtrados = await window.getFilteredEnvios();
    
    if (visibleCount) {
        visibleCount.textContent = `${filtrados.length} resultado${filtrados.length !== 1 ? 's' : ''}`;
    }

    if (!window.envios || window.envios.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        if (table) table.style.display = 'none';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (table) table.style.display = 'table';

    tbody.innerHTML = filtrados.map(e => {
        const disp = e.estado === 'despachado';
        return `
        <tr data-id="${e.id}" class="${disp ? 'dispatched' : ''}">
            <td><strong class="cell-orden ${disp ? 'dispatched' : ''}">${escapeHtml(e.numeroInterno)}</strong></td>
            <td class="cell-nombre ${disp ? 'dispatched' : ''}">${escapeHtml(e.destinatario)}</td>
            <td class="cell-tn ${disp ? 'dispatched' : ''}">${escapeHtml(e.tn)}</td>
            <td>${disp ? 
                '<span class="badge-status badge-dispatched"><span class="badge-dot"></span>DESPACHADO</span>' :
                '<span class="badge-status badge-pending"><span class="badge-dot"></span>PENDIENTE</span>'
            }</td>
            <td class="cell-date">${escapeHtml(e.fechaCarga)}${e.fechaDespacho ? `<br><span style="color:#3a5a3a">↗ ${escapeHtml(e.fechaDespacho)}</span>` : ''}</td>
            <td><button class="row-action-btn" onclick="window.deleteEnvioHandler('${e.id}')">✕</button></td>
        </tr>`;
    }).join('');
    
    if (window.addLog) window.addLog(`✅ Tabla renderizada: ${filtrados.length} elementos`);
}

async function updateStats() {
    const stats = await window.updateStatsFromAPI();
    
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statDispatched = document.getElementById('stat-dispatched');
    
    if (statTotal) statTotal.textContent = stats.total;
    if (statPending) statPending.textContent = stats.pendientes;
    if (statDispatched) statDispatched.textContent = stats.despachados;
    
    if (window.addLog) window.addLog(`📊 Stats: Total=${stats.total}, Pendientes=${stats.pendientes}, Despachados=${stats.despachados}`);
}

async function setFilter(filter) {
    window.currentFilter = filter;
    if (window.addLog) window.addLog(`🔍 Filtro cambiado a: ${filter}`);
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        }
    });
    await renderTable();
}

function exportCSV() {
    if (!window.envios || window.envios.length === 0) {
        if (window.showToast) window.showToast('No hay datos para exportar', 'info');
        return;
    }
    
    const cols = ['N° Interno', 'Destinatario', 'N° Seguimiento', 'Estado', 'Fecha Carga', 'Fecha Despacho'];
    const rows = window.envios.map(e => [
        e.numeroInterno, e.destinatario, e.tn, e.estado, e.fechaCarga, e.fechaDespacho || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    
    const csv = [cols.join(','), ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.setAttribute('download', `andreani_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if (window.addLog) window.addLog(`📥 CSV exportado`);
    if (window.showToast) window.showToast('✓ CSV exportado', 'ok');
}

async function confirmClearAll() {
    if (confirm('¿Eliminar TODOS los envíos? Esta acción no se puede deshacer.')) {
        await window.clearAllEnvios();
        await renderTable();
        await updateStats();
        if (window.showToast) window.showToast('Base de datos limpiada', 'info');
    }
}

async function resetDispatched() {
    const count = await window.resetAllDispatched();
    if (count === 0) {
        if (window.showToast) window.showToast('No hay envíos despachados', 'info');
        return;
    }
    await renderTable();
    await updateStats();
    if (window.showToast) window.showToast(`↩ ${count} envío(s) restablecidos a pendiente`, 'ok');
}

// Handler global para eliminar envíos
window.deleteEnvioHandler = async function(id) {
    await window.deleteEnvio(id);
    await renderTable();
    await updateStats();
    if (window.showToast) window.showToast('Envío eliminado', 'info');
};

let toastTimer;
function showToast(msg, type = 'info') {
    if (window.addLog) window.addLog(`TOAST [${type}]: ${msg}`);
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `show toast-${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.classList.remove('show'); }, 3500);
}

function addLog(msg) {
    console.log(msg);
    // Opcional: mostrar en un panel visible
}

// Exportar funciones globales
window.renderTable = renderTable;
window.updateStats = updateStats;
window.setFilter = setFilter;
window.exportCSV = exportCSV;
window.confirmClearAll = confirmClearAll;
window.resetDispatched = resetDispatched;
window.showToast = showToast;
window.addLog = addLog;