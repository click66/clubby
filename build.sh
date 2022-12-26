#!/bin/sh

TARGET_DIR=${1:-.}

docker-compose build

# Back end
docker-compose -f docker-compose.yml run app bash -c "python ./manage.py collectstatic --no-input && tar -zcvf app.tar.gz --files-from=buildfiles.txt"
docker cp $(docker-compose ps -a -q app):/app/app.tar.gz "$TARGET_DIR/app.tar.gz"

# Front end
docker-compose -f docker-compose.yml run npm bash -c "run build && tar -zcvf static.tar.gz static"
docker cp $(docker-compose ps -a -q npm):/app/static.tar.gz "$TARGET_DIR/static.tar.gz"
