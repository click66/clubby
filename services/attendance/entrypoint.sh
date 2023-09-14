#!/bin/bash

# DB migrations
/app/.venv/bin/alembic upgrade head

/app/.venv/bin/python ./data-migration.py
