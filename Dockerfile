FROM python:3.10 as base
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Install Poetry
ENV PATH="/root/.local/bin:$PATH"
RUN curl -sSL https://install.python-poetry.org | python3 -

# Install Poetry dependencies
COPY poetry.* pyproject.toml ./
RUN POETRY_VIRTUALENVS_IN_PROJECT=1 poetry install

FROM base AS runtime

# Copy virtual env from python-deps stage
COPY --from=base /.venv /.venv
ENV PATH="/.venv/bin:$PATH"

# Create and switch to a new user
RUN useradd --create-home appuser
#WORKDIR /home/appuser
#USER appuser

# Install application into container
#USER appuser
WORKDIR /app
COPY . .
