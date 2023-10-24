# Clubby

## First Run Setup

```bash
docker compose up --build

# Migrate main database
docker compose exec app poetry run ./manage.py migrate

# Migrate attendance database
docker compose exec attendance-service poetry run alembic upgrade head
```

## Dev Environment

### Accessing admin and member sites

* Admin site: http://localhost:8080
* Member site: http://localhost:8081
