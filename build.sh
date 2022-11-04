#!/bin/sh

TARGET_DIR=${1:-.}

docker-compose build
docker-compose -f docker-compose.yml run app tar -zcvf app.tar.gz --files-from=buildfiles.txt
docker cp $(docker-compose ps -a -q app):/app/app.tar.gz "$TARGET_DIR/app.tar.gz"
