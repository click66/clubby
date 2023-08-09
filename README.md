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

# Dev Environment

## Accessing admin and member sides

By default, accessing `localhost:8000` will access the manager admin side of the site. In order to use both the admin and member sides of the site interchangeably, add aliases to your /etc/hosts file:

```bash
127.0.0.1 admin.southamptonjiujitsu.local
127.0.0.1 members.southamptonjiujitsu.local
```

After this is done you can access the relevant sites using the following URLs in a browser (port number *is* required):

* Admin site: `admin.southamptonjiujitsu.local:8000`
* Members site: `members.southamptonjiujitsu.local:8000`