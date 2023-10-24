FROM public.ecr.aws/lambda/python:3.9

RUN yum -y update
RUN cat <<EOL > /etc/yum.repos.d/pgdg.repo
[pgdg14]
name=PostgreSQL 14 for RHEL/CentOS7 - x86_64
gpgkey=https://download.postgresql.org/pub/repos/yum/RPM-GPG-KEY-PGDG-14
baseurl=https://download.postgresql.org/pub/repos/yum/14/redhat/rhel-7-x86_64/
enabled=1
gpgcheck=1
EOL
RUN sed "s/rhel-\$releasever-\$basearch/rhel-7.5-x86_64/g" "/etc/yum.repos.d/pgdg.repo"
RUN yum install postgresql14 -y

WORKDIR ${LAMBDA_TASK_ROUTE}

COPY index.py ./

CMD ["index.handler"]
