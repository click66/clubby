FROM python:3.10 as base
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Install Poetry
ENV PATH="/root/.local/bin:$PATH"
RUN curl -sSL https://install.python-poetry.org | python3 -

# Install Poetry dependencies
COPY poetry.* pyproject.toml /app/
WORKDIR /app
ENV POETRY_VIRTUALENVS_IN_PROJECT="true"
RUN poetry install

FROM base AS runtime

# Copy virtual env from python-deps stage
COPY --from=base /app/.venv /.venv
ENV PATH="/.venv/bin:$PATH"

# Install application into container
WORKDIR /app
COPY . .
