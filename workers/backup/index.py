import boto3
import logging
import psycopg2
import os
import subprocess
import urllib
from datetime import datetime

DB_HOST = '10.0.0.186'
S3_BUCKET = os.environ.get('S3_BUCKET')

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    logger.info('Invoking handler')

    ssm = boto3.client('ssm')
    db_password = ssm.get_parameter(Name='sjcadmin_PGPASS', WithDecryption=True)[
        'Parameter']['Value']
    logger.info('Parameters retrieved')

    backup_database('southamptonjiujitsu', db_password, db_user='sjcadmin')
    backup_database('sjcattendance', db_password)


def backup_database(database_name, db_password, db_user=None, schema='public'):
    dt = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    try:
        logger.info(f'Attempting connection to {database_name}')
        db_user = database_name if db_user is None else db_user
        # conn = psycopg2.connect(
        #     host=DB_HOST,
        #     database=database_name,
        #     user=db_user,
        #     password=db_password,
        # )
        # logger.info(f'Successfully connected to {database_name}')
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
        # if conn:
        #     conn.close()
