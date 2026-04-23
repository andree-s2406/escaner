// API Client - Detecta automáticamente el entorno
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : window.location.origin + '/api';

class API {
    static async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    static async getEnvios(estado = null) {
        const url = estado ? `/envios?estado=${estado}` : '/envios';
        const response = await this.request(url);
        return response.data;
    }
    
    static async getEnvio(tn) {
        const response = await this.request(`/envios/${tn}`);
        return response.data;
    }
    
    static async createEnvio(envio) {
        const response = await this.request('/envios', {
            method: 'POST',
            body: JSON.stringify(envio)
        });
        return response.data;
    }
    
    static async createEnviosBatch(envios) {
        const response = await this.request('/envios/batch', {
            method: 'POST',
            body: JSON.stringify({ envios })
        });
        return response;
    }
    
    static async despacharEnvio(tn) {
        const response = await this.request(`/envios/${tn}/despachar`, {
            method: 'PUT'
        });
        return response.data;
    }
    
    static async actualizarEnvio(numero_interno, tn) {
        const response = await this.request(`/envios/${numero_interno}/actualizar`, {
            method: 'PUT',
            body: JSON.stringify({ tn: tn })
        });
        return response.data;
    }
    
    static async deleteEnvio(id) {
        await this.request(`/envios/${id}`, {
            method: 'DELETE'
        });
    }
    
    static async resetDespachados() {
        const response = await this.request('/envios/reset-despachados', {
            method: 'POST'
        });
        return response.reseteados;
    }
    
    static async clearAll() {
        const response = await this.request('/envios/clear-all', {
            method: 'DELETE'
        });
        return response.eliminados;
    }
    
    static async getStats() {
        const response = await this.request('/stats');
        return response.data;
    }
}

window.API = API;