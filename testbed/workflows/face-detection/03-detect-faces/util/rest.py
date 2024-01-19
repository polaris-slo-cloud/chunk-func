
def report_invalid_video_request(req_type: str) -> dict[str, any]:
    return {
        'statusCode': 400,
        'body': {
            'message': f'Incoming body is not a valid {req_type}.',
        },
        'headers': {
            'content-type': 'application/json',
        },
    }

def check_field_exists_or_error(data: dict[str, any], key: str, typ: type, req_class: type):
    if type(data[key]) is not typ:
        raise Exception(f'{key} is missing from {req_class}')
