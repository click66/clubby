def db_url(pg_host: str, pg_pass: str):
    return f'postgresql+psycopg2://sjcattendance:{pg_pass}@{pg_host}:5432/sjcattendance'
