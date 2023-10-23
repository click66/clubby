import os
import boto3
import logging
import psycopg2
import subprocess
import urllib

DB_HOST = '10.0.0.186'
S3_BUCKET = os.environ.get('S3_BUCKET')
S3_KEY = 'backup.sql'

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    logger.info('Invoking handler')
    ssm = boto3.client('ssm')
    db_password = ssm.get_parameter(Name='sjcadmin_PGPASS', WithDecryption=True)[
        'Parameter']['Value']

    backup_database('southamptonjiujitsu', db_password, db_user='sjcadmin')
    backup_database('sjcattendance', db_password)


def backup_database(database_name, db_password, db_user=None):
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=database_name,
            user=database_name if db_user is None else db_user,
            password=db_password,
        )

        cmd = f'pg_dump -h {DB_HOST} -U {database_name} {database_name} -f /tmp/{database_name}.sql'
        subprocess.run(cmd, shell=True, check=True)

        s3 = boto3.client('s3')
        s3.upload_file(f'/tmp/{database_name}.sql',
                       S3_BUCKET, f'{S3_KEY}/{database_name}.sql')

    except Exception as e:
        print(f'Error backing up {database_name} database: {str(e)}')

    finally:
        if conn:
            conn.close()
