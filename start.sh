poetry run ./manage.py migrate --database default
poetry run ./manage.py migrate --database attendance
poetry run ./data-migration.py

poetry run gunicorn --workers 4 --reload sjcadmin.wsgi:application -b 0.0.0.0:8000
# poetry run uvicorn sjcadmin.asgi:application --host 0.0.0.0 --port 8000 --workers 4
