#!/bin/bash
export AWS_ACCESS_KEY_ID=LKIARGPGSK4LMB2A3YFS

awslocal sns create-topic --name sjcadmin-attendance --region eu-west-2
awslocal sqs create-queue --queue-name sjcadmin-attendance-worker-prod-jobs --region eu-west-2
awslocal sns subscribe --topic-arn arn:aws:sns:eu-west-2:082624796438:sjcadmin-attendance --protocol sqs --notification-endpoint arn:aws:sqs:eu-west-2:082624796438:sjcadmin-attendance-worker-prod-jobs --region eu-west-2

# Lambda setup
mkdir attendance-worker && cd attendance-worker
pip install --target ./attendance-worker requests
cd attendance-worker
zip -r ../function.zip .
cd ..
zip -j function.zip /app/workers/attendance/index.py


awslocal lambda create-function \
    --function-name sjcadmin-attendance-worker-jobs \
    --runtime python3.9 \
    --zip-file fileb://function.zip \
    --handler index.consumer \
    --role arn:aws:iam::082624796438:role/lambda-role \
    --region eu-west-2 \
    --environment Variables={API_ROOT=http://api.southamptonjiujitsu.local:8000}

awslocal lambda create-event-source-mapping \
    --function-name sjcadmin-attendance-worker-jobs \
    --batch-size 1 \
    --event-source-arn arn:aws:sqs:eu-west-2:082624796438:sjcadmin-attendance-worker-prod-jobs \
    --endpoint-url http://localhost:4566 \
    --region eu-west-2