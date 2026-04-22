import os

class Config:
    # CockroachDB URL desde variables de entorno
    DATABASE_URL = os.environ.get('DATABASE_URL', '')
    
    # Para Render, la URL viene con 'postgresql://' pero CockroachDB usa 'postgresql://'
    # Asegurar que tiene el formato correcto
    if DATABASE_URL and 'cockroachlabs' in DATABASE_URL:
        # CockroachDB necesita parámetros especiales
        DATABASE_URL = DATABASE_URL + '&sslmode=verify-full'
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 10,
        "pool_recycle": 3600,
        "pool_pre_ping": True
    }
    
    # Configuración CORS para Render
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')