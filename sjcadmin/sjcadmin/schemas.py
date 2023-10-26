import humps
from rest_framework import serializers


class BaseSerialiser(serializers.Serializer):
    def to_representation(self, instance):
        return humps.camelize(super().to_representation(instance))

    def to_internal_value(self, data):
        # Convert keys from camelCase to snake_case
        data = self.camelize_keys_to_snake_case(data)
        # Call the parent class's to_internal_value method
        return super().to_internal_value(data)

    def camelize_keys_to_snake_case(self, data):
        if isinstance(data, list):
            return [self.camelize_keys_to_snake_case(item) for item in data]
        elif isinstance(data, dict):
            return {self.camelize_to_snake_case(key): value for key, value in data.items()}
        else:
            return data

    def camelize_to_snake_case(self, key):
        # Convert camelCase to snake_case
        return ''.join(['_' + i.lower() if i.isupper() else i for i in key]).lstrip('_')
