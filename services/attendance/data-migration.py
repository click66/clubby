#!/usr/bin/env python
import os
import psycopg2

# Define the source and target database connection parameters
source_db_params = {
    "host": os.getenv('PGHOST'),
    "database": "southamptonjiujitsu",
    "user": "sjcadmin",
    "password": os.getenv('PGPASS'),
}

target_db_params = {
    "host": os.getenv('PGHOST'),
    "database": "sjcattendance",
    "user": "sjcattendance",
    "password": os.getenv('PGPASS'),
}

# Connect to the source and target databases
try:
    source_conn = psycopg2.connect(**source_db_params)
    target_conn = psycopg2.connect(**target_db_params)
except psycopg2.Error as e:
    print(f"Error connecting to the databases: {e}")
    exit(1)


# Create cursors for both connections
source_cursor = source_conn.cursor()
target_cursor = target_conn.cursor()

# Execute the first SELECT query
select_query_1 = "SELECT id, paid, complementary FROM sjcadmin_attendance sa"
source_cursor.execute(select_query_1)
source_resolutions = source_cursor.fetchall()

# Execute the second SELECT query
select_query_2 = "SELECT id, date, course_uuid, student_id AS student_uuid, id AS resolution FROM sjcadmin_attendance attendance"
source_cursor.execute(select_query_2)
source_attendances = source_cursor.fetchall()


resolution_insert = "INSERT INTO sjcattendance_resolution (id, paid, complementary) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING;"
attendance_insert = "INSERT INTO sjcattendance_attendance (id, date, course_uuid, student_uuid, resolution) VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;"


# Insert data into the target tables
target_cursor.executemany(resolution_insert, source_resolutions)
target_cursor.executemany(attendance_insert, source_attendances)

# Commit the changes and close connections
target_conn.commit()
source_conn.close()
target_conn.close()

print("Data transfer completed successfully.")
