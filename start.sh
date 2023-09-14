poetry run ./manage.py migrate --database default

poetry run gunicorn --workers 4 --reload sjcadmin.wsgi:application -b 0.0.0.0:8000
