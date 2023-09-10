import boto3
import json
import os


class Producer:
    _instance = None

    def __new__(cls):
        if not cls._instance:
            cls._instance = super().__new__(cls)

        return cls._instance

    def __init__(self):
        self.client = boto3.Session(region_name='eu-west-2').client('sns', **(
            {'aws_access_key_id': 'LKIARGPGSK4LMB2A3YFS', 'aws_secret_access_key': 'bar', 'endpoint_url': 'http://localstack:4566'} if os.environ.get('ENVIRONMENT_NAME') == 'local' else {}))
        self.topic_arn = 'arn:aws:sns:eu-west-2:082624796438:sjcadmin-attendance'

    def publish(self, msg: dict):
        response = self.client.publish(TopicArn=self.topic_arn,
                                       Message=json.dumps({'default': msg})),

        return response


def get_producer() -> Producer:
    return Producer()
