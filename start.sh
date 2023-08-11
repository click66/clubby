poetry run ./manage.py migrate

poetry run gunicorn --reload sjcadmin.wsgi:application -b 0.0.0.0:8000