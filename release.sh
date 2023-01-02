#!/usr/bin/env bash

FE_ARTIFACT_PATH=$1
BE_ARTIFACT_PATH=$2
RELEASES_DIR=$3
DEPLOY_DIR=$4
SERVED_PATH=$5

echo "Extracting artifacts to target directory..."
mkdir -p $DEPLOY_DIR
tar -xvzf $FE_ARTIFACT_PATH -C $DEPLOY_DIR
tar -xvzf $BE_ARTIFACT_PATH -C $DEPLOY_DIR

echo "Build venv"
cd $DEPLOY_DIR
~/.local/bin/poetry install

echo "Making new release live..."
ln -sfn $DEPLOY_DIR $SERVED_PATH
sudo /bin/systemctl restart gunicorn

echo "Removing artifacts..."
rm $FE_ARTIFACT_PATH
rm $BE_ARTIFACT_PATH

echo "Removing old releases..."
cd $RELEASES_DIR
ls -1 | sort | head -n -5 | xargs rm -rf
