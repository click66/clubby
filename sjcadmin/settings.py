"""
Django settings for sjcadmin project.

Generated by 'django-admin startproject' using Django 4.1.2.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""
import os
import sentry_sdk

from pathlib import Path
from sentry_sdk.integrations.django import DjangoIntegration

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('ENVIRONMENT_NAME') == 'local'

ALLOWED_HOSTS = [
    'app',
    'localhost',
    'admin.southamptonjiujitsu.local',
    'auth.southamptonjiujitsu.local',
    'members.southamptonjiujitsu.local',
    'monolith.southamptonjiujitsu.local',
    'admin.southamptonjiujitsu.com',
    'members.southamptonjiujitsu.com',
    'auth.southamptonjiujitsu.com',
    'auth.southcoastjiujitsu.com',
    'monolith.southamptonjiujitsu.com',
    'monolith.southcoastjiujitsu.com',
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://admin.southamptonjiujitsu.local:8000',
    'http://members.southamptonjiujitsu.local:8000',
    'http://monolith.southamptonjiujitsu.local:8000',
    'https://admin.southamptonjiujitsu.com',
    'https://members.southamptonjiujitsu.com',
    'https://monolith.southamptonjiujitsu.com',
    'https://admin.southcoastjiujitsu.com',
]

# Application definition

INSTALLED_APPS = [
    'corsheaders',
    'dbbackup',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_hosts',
    'sjcadmin.sjcadmin',
    'sjcadmin.sjcmembers',
    'sjcadmin.sjcauth',
    'silk',
]

MIDDLEWARE = [
    'django_hosts.middleware.HostsRequestMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django_hosts.middleware.HostsResponseMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://admin.southamptonjiujitsu.local:8080",
    "http://admin.southamptonjiujitsu.local:8000",
    "https://admin.southamptonjiujitsu.com",
    "https://admin.southcoastjiujitsu.com",
]

ROOT_URLCONF = 'sjcadmin.sjcadmin.urls'
ROOT_HOSTCONF = 'sjcadmin.hosts'
DEFAULT_HOST = 'admin'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'sjcadmin.wsgi.application'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'sjcadmin': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': os.environ.get('PGHOST'),
        'NAME': 'southamptonjiujitsu',
        'USER': 'sjcadmin',
        'PASSWORD': os.environ.get('PGPASS'),
        'PORT': 5432,
    },
}

DBBACKUP_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
DBBACKUP_STORAGE_OPTIONS = {
    'access_key': os.environ.get('SJJ_S3_ACCESS_KEY'),
    'secret_key': os.environ.get('SJJ_S3_SECRET_KEY'),
    'bucket_name': 'southamptonjiujitsu',
    'default_acl': 'private',
    'location': 'sjcadmin-backups/django/',
}
DBBACKUP_CONNECTOR_MAPPING = {
    'django.db.backends.postgresql': 'dbbackup.db.postgresql.PgDumpBinaryConnector',
}


AUTH_USER_MODEL = 'sjcauth.User'

# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = 'static/'

STATICFILES_DIRS = [
    # os.path.join(BASE_DIR, 'static'),
]
STATIC_ROOT = os.path.join(BASE_DIR, "static")

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Mail setup
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# AWS = email-smtp.eu-west-1.amazonaws.com
EMAIL_HOST = os.environ.get('EMAIL_HOST')
EMAIL_PORT = os.environ.get('EMAIL_PORT')   # AWS = 587
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS') == 'true'
EMAIL_USE_SSL = False
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = 'noreply@southamptonjiujitsu.com'

# Sentry setup
sentry_sdk.init(
    dsn="https://d5aabe61b93c35aac123b8a1ba004256@o4505855644205056.ingest.sentry.io/4505855655608320",
    environment=os.environ.get('ENVIRONMENT_NAME'),
    integrations=[DjangoIntegration()],
    send_default_pii=True,
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'sjcadmin.authentication.CsrfExemptSessionAuthentication',
        'rest_framework.authentication.BasicAuthentication'
    ],
}
