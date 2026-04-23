import os

class Config:
    DATABASE_URL = os.environ.get('DATABASE_URL', '')
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 5,
        "pool_recycle": 3600,
        "pool_pre_ping": True
    }
    
    # Permitir TODOS los orígenes para desarrollo
    CORS_ORIGINS = '*'