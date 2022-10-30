FROM python:3.10 as python-deps
RUN pip3 install pipenv
RUN apt-get update && apt-get install -y --no-install-recommends gcc

COPY Pipfile Pipfile.lock ./
RUN PIPENV_VENV_IN_PROJECT=1 pipenv install --deploy
RUN pipenv sync


FROM python-deps AS runtime

# Copy virtual env from python-deps stage
COPY --from=python-deps /.venv /.venv
ENV PATH="/.venv/bin:$PATH"

# Create and switch to a new user
RUN useradd --create-home appuser
WORKDIR /home/appuser
USER appuser

# Install application into container
WORKDIR /app
COPY . .