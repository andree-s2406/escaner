import os
from pathlib import Path

class Config:
    # Base directory (backend/)
    BASE_DIR = Path(__file__).parent
    
    # URL base de CockroachDB (sin parámetros SSL)
    DATABASE_URL = os.environ.get('DATABASE_URL', '').split('?')[0]
    
    # Ruta al certificado
    SSL_CERT_PATH = BASE_DIR / 'certs' / 'root.crt'
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 5,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
        "connect_args": {
            "sslmode": "verify-full",
            "sslrootcert": str(SSL_CERT_PATH)
        }
    }
    
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')