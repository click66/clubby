# First Run Setup
In app container:
```bash
# Up database to latest version
$ ./manage.py migrate

# Make user admin user exists
$ ./manage.py createsuperuser
```

# Backups
App is configured with django-dbbackup.

```bash
# Back up database
$ ./manage.py dbbackup

# Restore database
$ ./manage.py migrate
$ ./manage.py dbrestore
```