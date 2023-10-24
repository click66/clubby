FROM public.ecr.aws/lambda/python:3.9

RUN yum -y update
RUN echo -e "\
[pgdg14] \n\
name=PostgreSQL 14 for RHEL/CentOS7 - x86_64 \n\
gpgkey=https://download.postgresql.org/pub/repos/yum/RPM-GPG-KEY-PGDG-14 \n\
baseurl=https://download.postgresql.org/pub/repos/yum/14/redhat/rhel-7-x86_64/ \n\
enabled=1 \n\
gpgcheck=1 \n\
" > /etc/yum.repos.d/pgdg.repo
RUN sed "s/rhel-\$releasever-\$basearch/rhel-7.5-x86_64/g" "/etc/yum.repos.d/pgdg.repo"
RUN yum install postgresql14 -y

# RUN pip install psycopg2-binary

# ENV PATH="/root/.local/bin:$PATH"
# RUN curl -sSL https://install.python-poetry.org | python3 -

WORKDIR ${LAMBDA_TASK_ROUTE}
# COPY poetry.* pyproject.toml ./

# RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --no-root

COPY index.sh ./

CMD ["index.handler"]
