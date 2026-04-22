import os

class Config:
    # URL limpia y directa
    DATABASE_URL = os.environ.get('DATABASE_URL', '').strip('"\'')
    
    # Quitar cualquier parámetro sslmode de la URL (lo manejamos aparte)
    if '?sslmode=' in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split('?')[0]
    
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