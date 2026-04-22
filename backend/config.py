import os

class Config:
    # Tomar la URL base SIN parámetros
    raw_url = os.environ.get('DATABASE_URL', '')
    
    # Limpiar la URL: eliminar cualquier parámetro sslmode existente
    if '?' in raw_url:
        base_url = raw_url.split('?')[0]
    else:
        base_url = raw_url
    
    # Eliminar comillas o paréntesis si los hay
    base_url = base_url.strip('"\'')
    
    DATABASE_URL = base_url
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 5,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
        "connect_args": {
            "sslmode": "verify-full"
        }
    }
    
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    print(f"🔌 Base de datos configurada (URL limpiada)")