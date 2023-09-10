FROM python:3.9 as base

ENV PATH="/root/.local/bin:$PATH"
RUN curl -sSL https://install.python-poetry.org | python3 -

WORKDIR /app
COPY poetry.* pyproject.toml ./

ENV POETRY_VIRTUALENVS_IN_PROJECT="true"
RUN poetry install --without dev --sync


FROM public.ecr.aws/lambda/python:3.9 as runtime

WORKDIR ${LAMBDA_TASK_ROUTE}
COPY --from=base /app/.venv .venv
COPY index.py ./

CMD ["index.consumer"]
