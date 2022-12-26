#!/bin/sh

BUILD_DIR=$1
SSH_HOST=$2
SSH_USER=$3

NOW=`date +%Y%m%d%H%M%S%N`

BE_ARTIFACT_NAME="app.tar.gz"
FE_ARTIFACT_NAME="static.tar.gz"

BE_ARTIFACT_PATH="./artifacts/$BE_ARTIFACT_NAME"
FE_ARTIFACT_PATH="./artifacts/$FE_ARTIFACT_NAME"

RELEASES_DIR="/var/www/sjc-control/releases"
DEPLOY_DIR="$RELEASES_DIR/$NOW"
SERVED_PATH="/var/www/sjc-control/current"

echo "Copying files to remote server..."
scp -r "$BUILD_DIR/$BE_ARTIFACT_NAME" $SSH_USER@$SSH_HOST:$BE_ARTIFACT_PATH
scp -r "$BUILD_DIR/$FE_ARTIFACT_NAME" $SSH_USER@$SSH_HOST:$FE_ARTIFACT_NAME

echo "Starting release..."
sssh $SSH_USER@$SSH_HOST "bash -s" < ./release.sh $FE_ARTIFACT_NAME $BE_ARTIFACT_NAME $RELEASES_DIR $DEPLOY_DIR $SERVED_PATH
