# Install base dependencies and application code
FROM python:3.10 as base
RUN apt-get update && apt-get install -y --no-install-recommends gcc

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
