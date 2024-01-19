from parliament import Context
from flask import Request
import cv2
import util
import objstore
from video import DetectFacesRequest

print('detect-faces function starting')

def open_video(input: DetectFacesRequest) -> cv2.VideoCapture:
    read_url = generate_read_url(input)
    video = cv2.VideoCapture(read_url)
    return video

def generate_read_url(input: objstore.ObjectStoreReference) -> str:
    client = objstore.s3.create_client(input)
    read_url = objstore.s3.create_read_url(client, input)
    return read_url

def main(context: Context):
    print("Received request")

    if 'request' in context.keys():
        req = DetectFacesRequest.from_dict(context.request.get_json())
        video = open_video(req.input)
        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = video.get(cv2.CAP_PROP_FPS)

        return {'success': True, 'width': width, 'height': height, 'fps': fps}, 200
    else:
        print("Empty request", flush=True)
        return util.rest.report_invalid_video_request('DetectFaces'), 400
