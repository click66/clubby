# Install base dependencies and application code
FROM python:3.10-bullseye as base
RUN apt-get update && apt-get install -y --no-install-recommends gcc

RUN curl https://www.postgresql.org/media/keys/ACCC4CF8.asc \
| gpg --dearmor \
| tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" \
> /etc/apt/sources.list.d/postgresql.list'
RUN apt-get update && apt-get install -y postgresql-client-14

ENV PATH="/root/.local/bin:$PATH"
RUN curl -sSL https://install.python-poetry.org | python3 -

COPY poetry.* pyproject.toml /app/
WORKDIR /app
ENV POETRY_VIRTUALENVS_IN_PROJECT="true"
RUN poetry install --without dev --sync

WORKDIR /app
COPY . .


# Install dev dependencies
FROM base as dev-base
RUN poetry install --with dev --sync


# Run application in dev mode
FROM dev-base AS dev-runtime

COPY --from=base /app/.venv /.venv
ENV PATH="/.venv/bin:$PATH"

CMD python manage.py runserver 0.0.0.0:8000


# Run application in prod mode
FROM base as prod-runtime

COPY --from=base /app/.venv /.venv
ENV path="/.venv/bin:$PATH"

CMD ["sh", "/app/start.sh"]