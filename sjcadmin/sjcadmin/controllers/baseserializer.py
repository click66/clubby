import humps
from rest_framework import serializers


class BaseSerialiser(serializers.Serializer):
    def to_internal_value(self, data):
        snake_case_data = {}

        # Convert camelCase keys to snake_case
        for key, value in data.items():
            snake_case_key = humps.decamelize(key)
            snake_case_data[snake_case_key] = value

        return super().to_internal_value(snake_case_data)

    def to_representation(self, instance):
        return humps.camelize(super().to_representation(instance))
