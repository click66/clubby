import json
import requests
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

API_ROOT = os.getenv('API_ROOT')


def _create(payload: dict):
    api_url = f"{API_ROOT}/attendance/"

    try:
        # Make a POST request to the API endpoint
        response = requests.post(api_url, json=payload)

        if response.status_code == 204:
            logger.info(f"Successfully POST message to {api_url}")
        else:
            logger.info(
                f"Failed to POST message to {api_url}. Status code: {response.status_code}")
    except Exception as e:
        logger.info(f"Error while POSTting message to {api_url}: {str(e)}")


def _delete_by_id(payload: dict):
    api_url = f"{API_ROOT}/attendance/{payload['id']}"

    try:
        response = requests.delete(api_url)

        if response.status_code == 204:
            logger.info(f"Successfully issued DELETE to {api_url}")
        else:
            logger.info(
                f"Failed to DELETE {api_url}. Status code: {response.status_code}")
    except Exception as e:
        logger.info(f"Error while DELETing {api_url}: {str(e)}")


def _delete_by_criteria(payload: dict):
    api_url = f"{API_ROOT}/attendance/delete"

    try:
        response = requests.post(api_url, json=payload)

        if response.status_code == 204:
            logger.info(f"Successfully POST message to {api_url}")
        else:
            logger.info(
                f"Failed to POST message to {api_url}. Status code: {response.status_code}")
    except Exception as e:
        logger.info(f"Error while POSTting message to {api_url}: {str(e)}")


def consumer(event, context):
    router = {
        'create': _create,
        'delete': _delete_by_criteria,
    }

    for record in event['Records']:
        message_body = json.loads(json.loads(
            record['body'])['Message'])['default']
        logger.debug(message_body)

        if callable(target := router.get(message_body['action'])):
            target(message_body['data'])
