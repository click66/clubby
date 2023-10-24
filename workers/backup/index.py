import boto3
import logging
import os
import subprocess
from datetime import datetime

DB_HOST = os.environ.get('DB_HOST')
S3_BUCKET = os.environ.get('S3_BUCKET')

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    logger.info('Invoking handler')

    backup_database('southamptonjiujitsu', db_user='sjcadmin')
    backup_database('sjcattendance')


def backup_database(database_name, db_user=None, schema='public'):
    dt = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    try:
        logger.info(f'Retrieving credentials for {database_name}')
        ssm = boto3.client('ssm')
        db_password = ssm.get_parameter(Name=f'sjcadmin_PGPASS_{database_name}', WithDecryption=True)[
            'Parameter']['Value']
        logger.info('Credentials retrieved')

        logger.info(f'Attempting connection to {database_name}')
        db_user = database_name if db_user is None else db_user
        logger.info(f'Running db dump...')
        cmd = f'pg_dump -h {DB_HOST} -U {db_user} {database_name} -f /tmp/{database_name}.sql'
        proc = subprocess.Popen(cmd, shell=True, env={
            **os.environ,
            'PGPASSWORD': db_password,
        })
        proc.wait()

        logger.info(f'Uploading dump to S3...')
        s3 = boto3.client('s3')
        s3.upload_file(f'/tmp/{database_name}.sql',
                       S3_BUCKET, f'{dt}/{database_name}/{schema}.sql')

    except Exception as e:
        logger.info(f'Error backing up {database_name} database: {str(e)}')

    finally:
        logger.info(f'Finished, closing connection to {database_name}')
