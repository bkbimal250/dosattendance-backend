from .base import *
import os

DEBUG = False

ALLOWED_HOSTS = [host.strip() for host in os.environ.get('ALLOWED_HOSTS', 'company.d0s369.co.in').split(',') if host.strip()]

# Database configuration for production
# Usually taken from environment variables
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'u434975676_DOS'),
        'USER': os.environ.get('DB_USER', 'u434975676_bimal'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'DishaSolution@8989'),
        'HOST': os.environ.get('DB_HOST', '193.203.184.215'),
        'PORT': os.environ.get('DB_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'connect_timeout': 60,
        },
        'CONN_MAX_AGE': 600,
    }
}

# Channels Configuration for production (uses Redis)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(os.environ.get('REDIS_HOST', 'localhost'), int(os.environ.get('REDIS_PORT', 6379)))],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Only enable aggressive redirects/HSTS if specifically requested in .env
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False').lower() == 'true'

# HSTS settings - only if SSL redirect is enabled
if SECURE_SSL_REDIRECT:
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
else:
    SECURE_HSTS_SECONDS = 0
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
