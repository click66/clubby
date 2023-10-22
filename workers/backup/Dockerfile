FROM public.ecr.aws/lambda/python:3.9

RUN pip install psycopg2-binary
ENV PATH="/root/.local/bin:$PATH"
RUN curl -sSL https://install.python-poetry.org | python3 -

WORKDIR ${LAMBDA_TASK_ROUTE}
COPY poetry.* pyproject.toml ./

RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --no-root

COPY index.py ./

CMD ["index.handler"]
