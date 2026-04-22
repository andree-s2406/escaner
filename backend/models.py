from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class Envio(db.Model):
    __tablename__ = 'envios'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tn = db.Column(db.String(20), unique=True, nullable=False, index=True)
    numero_interno = db.Column(db.String(20), nullable=True)
    destinatario = db.Column(db.String(200), nullable=False)
    estado = db.Column(db.String(20), default='pendiente', index=True)
    fecha_carga = db.Column(db.DateTime, default=datetime.now)
    fecha_despacho = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'tn': self.tn,
            'numeroInterno': self.numero_interno,
            'destinatario': self.destinatario,
            'estado': self.estado,
            'fechaCarga': self.fecha_carga.strftime('%d/%m/%Y %H:%M') if self.fecha_carga else None,
            'fechaDespacho': self.fecha_despacho.strftime('%d/%m/%Y %H:%M') if self.fecha_despacho else None
        }