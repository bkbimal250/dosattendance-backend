from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Database configuration for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'u434975676_DOS',
        'USER': 'u434975676_bimal',
        'PASSWORD': 'DishaSolution@8989',
        'HOST': '193.203.184.215',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
            'connect_timeout': 30,
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
        'CONN_MAX_AGE': 0,
    }
}

# Channels Configuration for development
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
