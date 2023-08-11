#!/bin/sh

TARGET_DIR=${1:-.}

# Back end
# docker-compose -f docker-compose.yml build app
# docker-compose -f docker-compose.yml run app bash -c "tar -zcvf app.tar.gz --files-from=buildfiles.txt"
# docker cp $(docker-compose ps -a -q app):/app/app.tar.gz "$TARGET_DIR/app.tar.gz"
docker compose -f docker-compose.yml build app

# Front end
docker-compose -f docker-compose.yml build npm
docker-compose -f docker-compose.yml run --entrypoint=bash npm -c "npm run build && tar -zcvf static.tar.gz static"
docker cp $(docker-compose ps -a -q npm):/app/static.tar.gz "$TARGET_DIR/static.tar.gz"
