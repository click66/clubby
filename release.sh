#!/usr/bin/env bash

ARTIFACT_PATH=$1
RELEASES_DIR=$2
DEPLOY_DIR=$3
SERVED_PATH=$4

echo "Extracting artifact to target directory..."
mkdir -p $DEPLOY_DIR
tar -xvzf $ARTIFACT_PATH -C $DEPLOY_DIR

echo "Connecting static assets..."
touch "$DEPLOY_DIR/cache.txt"

echo "Making new release live..."
ln -sfn $DEPLOY_DIR $SERVED_PATH

echo "Removing artifact..."
rm $ARTIFACT_PATH

echo "Removing old releases..."
cd $RELEASES_DIR
ls -1 | sort | head -n -2 | xargs rm -rf
