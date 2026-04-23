from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from models import db, Envio
from config import Config
from datetime import datetime, timedelta
import os

# ==================== PARCHE PARA COCKROACHDB ====================
from sqlalchemy.dialects.postgresql.psycopg2 import PGDialect_psycopg2

original_get_server_version = PGDialect_psycopg2._get_server_version_info

def patched_get_server_version(self, connection):
    try:
        return original_get_server_version(self, connection)
    except AssertionError:
        print("⚠️ Detectada CockroachDB, usando versión fija (25.4.1)")
        return (25, 4, 1)

PGDialect_psycopg2._get_server_version_info = patched_get_server_version
# ==================== FIN PARCHE ====================

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, origins=Config.CORS_ORIGINS)

db.init_app(app)

# Crear tablas al iniciar
with app.app_context():
    db.create_all()
    print("✅ Base de datos conectada y tablas creadas")

# ==================== SERVIR FRONTEND ====================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@app.route('/')
def serve_frontend():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'js'), filename)

# ==================== API ENDPOINTS ====================
@app.route('/api/envios', methods=['GET'])
def get_envios():
    estado = request.args.get('estado')
    dias = request.args.get('dias')
    
    query = Envio.query
    
    # Filtrar por estado
    if estado:
        query = query.filter_by(estado=estado)
    
    # Filtrar por días (últimos N días)
    if dias and dias.isdigit():
        fecha_limite = datetime.now() - timedelta(days=int(dias))
        query = query.filter(Envio.fecha_carga >= fecha_limite)
        print(f"📅 Mostrando envíos de los últimos {dias} días")
    
    envios = query.order_by(Envio.fecha_carga.desc()).all()
    
    return jsonify({
        'success': True,
        'data': [e.to_dict() for e in envios],
        'total': len(envios)
    })

@app.route('/api/envios/<string:tn>', methods=['GET'])
def get_envio(tn):
    envio = Envio.query.filter_by(tn=tn).first()
    
    if not envio:
        return jsonify({'success': False, 'error': 'Envío no encontrado'}), 404
    
    return jsonify({'success': True, 'data': envio.to_dict()})

@app.route('/api/envios', methods=['POST'])
def create_envio():
    data = request.json
    
    existe = Envio.query.filter_by(tn=data['tn']).first()
    if existe:
        return jsonify({'success': False, 'error': 'El número de seguimiento ya existe'}), 400
    
    nuevo_envio = Envio(
        tn=data['tn'],
        numero_interno=data.get('numeroInterno', '—'),
        destinatario=data['destinatario'],
        estado='pendiente',
        fecha_carga=datetime.now()
    )
    
    db.session.add(nuevo_envio)
    db.session.commit()
    
    return jsonify({'success': True, 'data': nuevo_envio.to_dict()})

@app.route('/api/envios/batch', methods=['POST'])
def create_envios_batch():
    data = request.json
    envios_data = data.get('envios', [])
    
    nuevos = []
    duplicados = []
    
    for envio_data in envios_data:
        tn = envio_data.get('tn', '')
        
        if tn and tn.strip():
            existe = Envio.query.filter_by(tn=tn).first()
            if existe:
                duplicados.append(tn)
                continue
        
        nuevo = Envio(
            tn=tn,
            numero_interno=envio_data.get('numeroInterno', '—'),
            destinatario=envio_data['destinatario'],
            estado='pendiente',
            fecha_carga=datetime.now()
        )
        db.session.add(nuevo)
        nuevos.append(nuevo)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'nuevos': len(nuevos),
        'duplicados': len(duplicados),
        'data': [e.to_dict() for e in nuevos]
    })

@app.route('/api/envios/<string:numero_interno>/actualizar', methods=['PUT'])
def actualizar_envio(numero_interno):
    envio = Envio.query.filter_by(numero_interno=numero_interno).first()
    if not envio and not numero_interno.startswith('#'):
        envio = Envio.query.filter_by(numero_interno=f"#{numero_interno}").first()
    
    if not envio:
        return jsonify({'success': False, 'error': 'Envío no encontrado'}), 404
    
    data = request.json
    tn = data.get('tn')
    
    if tn:
        envio.tn = tn
    
    db.session.commit()
    
    return jsonify({'success': True, 'data': envio.to_dict()})

@app.route('/api/envios/<string:tn>/despachar', methods=['PUT'])
def despachar_envio(tn):
    envio = Envio.query.filter_by(tn=tn).first()
    
    if not envio:
        return jsonify({'success': False, 'error': 'Envío no encontrado'}), 404
    
    if envio.estado == 'despachado':
        return jsonify({'success': False, 'error': 'El envío ya está despachado'}), 400
    
    envio.estado = 'despachado'
    envio.fecha_despacho = datetime.now()
    db.session.commit()
    
    return jsonify({'success': True, 'data': envio.to_dict()})

@app.route('/api/envios/limpiar-antiguos', methods=['DELETE'])
def limpiar_envios_antiguos():
    """Elimina envíos que tengan más de 30 días"""
    try:
        fecha_limite = datetime.now() - timedelta(days=30)
        antiguos = Envio.query.filter(Envio.fecha_carga < fecha_limite).all()
        count = len(antiguos)
        
        for envio in antiguos:
            db.session.delete(envio)
        
        db.session.commit()
        print(f"🗑 Limpieza automática: {count} envíos eliminados (más de 30 días)")
        
        return jsonify({
            'success': True,
            'eliminados': count,
            'mensaje': f'Se eliminaron {count} envíos antiguos'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/envios/<string:id>', methods=['DELETE'])
def delete_envio(id):
    envio = Envio.query.get(id)
    
    if not envio:
        return jsonify({'success': False, 'error': 'Envío no encontrado'}), 404
    
    db.session.delete(envio)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Envío eliminado'})

@app.route('/api/envios/reset-despachados', methods=['POST'])
def reset_despachados():
    count = Envio.query.filter_by(estado='despachado').update({'estado': 'pendiente', 'fecha_despacho': None})
    db.session.commit()
    
    return jsonify({'success': True, 'reseteados': count})

@app.route('/api/envios/clear-all', methods=['DELETE'])
def clear_all():
    try:
        num_deleted = db.session.query(Envio).delete()
        db.session.commit()
        return jsonify({'success': True, 'eliminados': num_deleted})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    total = Envio.query.count()
    pendientes = Envio.query.filter_by(estado='pendiente').count()
    despachados = Envio.query.filter_by(estado='despachado').count()
    
    return jsonify({
        'success': True,
        'data': {
            'total': total,
            'pendientes': pendientes,
            'despachados': despachados
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)