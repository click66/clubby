import json
import requests
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

QUEUE_URL = os.getenv('QUEUE_URL')


def consumer(event, context):
    api_url = f"{os.getenv('API_ROOT')}/attendance/"

    # Process each SQS message in the event
    for record in event['Records']:
        # Decode the SQS message body
        message_body = json.loads(record['body'])

        # Assuming 'producer.publish' format for the message
        payload = {
            'action': message_body['action'],
            'data': message_body['data']
        }

        try:
            # Make a PUT request to the API endpoint
            response = requests.put(api_url, json=payload)

            if response.status_code == 200:
                logger.info(f"Successfully PUT message to {api_url}")
            else:
                logger.info(
                    f"Failed to PUT message to {api_url}. Status code: {response.status_code}")
        except Exception as e:
            logger.info(f"Error while PUTting message to {api_url}: {str(e)}")
