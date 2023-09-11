FROM public.ecr.aws/lambda/python:3.9

ENV PATH="/root/.local/bin:$PATH"
RUN curl -sSL https://install.python-poetry.org | python3 -

WORKDIR ${LAMBDA_TASK_ROUTE}
COPY poetry.* pyproject.toml ./

# ENV POETRY_VIRTUALENVS_IN_PROJECT="true"
# RUN poetry install --without dev --sync
RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --no-root

# WORKDIR ${LAMBDA_TASK_ROUTE}
# COPY --from=base /app/.venv .venv
COPY index.py ./

# ENV PYTHONPATH="/var/task/.venv/lib/"

CMD ["index.consumer"]
