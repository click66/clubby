FROM python:3.11 as build

RUN apt update -y && apt install -y curl

ENV POETRY_HOME=/usr/local
ENV POETRY_VIRTUALENVS_IN_PROJECT=true
RUN curl -sSL https://install.python-poetry.org | python3 -

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN poetry install --without dev --sync


FROM build as dev-build

RUN poetry install --with dev --sync


FROM dev-build as dev-runtime

ENV PYTHONPATH=/app

WORKDIR /app
COPY certs ./certs
COPY migrations ./migrations
COPY src ./src
COPY tests ./tests
COPY alembic.ini main.py ./

CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--reload"]


FROM nginx/unit:1.29.1-python3.11 as prod-runtime

COPY entrypoint.sh /docker-entrypoint.d/entrypoint.sh
COPY nginx.json /docker-entrypoint.d/config.json

WORKDIR /app
COPY --from=build /app/.venv .venv
COPY certs ./certs
COPY migrations ./migrations
COPY src ./src
COPY alembic.ini main.py data-migration.py ./
