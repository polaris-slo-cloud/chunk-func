from parliament import Context
from flask import Request
import cv2
from typing import Any, cast
import util
import objstore
import json
import uuid
from tempfile import NamedTemporaryFile
from video import DetectFacesRequest, DetectedFacesInVideo, find_faces, DetectFacesSuccessResponse

OUTPUT_BUCKET = 'output'

print('detect-faces function starting')

class DetectFacesRequestHandler:

    def open_video(self, input: objstore.ObjectStoreReference) -> cv2.VideoCapture:
        read_url = self.generate_read_url(input)
        video = cv2.VideoCapture(read_url)
        return video

    def generate_read_url(self, input: objstore.ObjectStoreReference) -> str:
        s3_client = objstore.s3.create_client(input)
        read_url = objstore.s3.create_read_url(s3_client, input)
        return read_url

    def generate_target_obj_ref(self, input: objstore.ObjectStoreReference) -> objstore.ObjectStoreReference:
        return objstore.ObjectStoreReference(
            url=input.url,
            user=input.user,
            password=input.password,
            bucket=OUTPUT_BUCKET,
            object_key=f'{input.object_key}-faces-{uuid.uuid1()}.json',
            object_size_bytes=0,
        )

    def save_output(self, faces: DetectedFacesInVideo, target_ref: objstore.ObjectStoreReference) -> objstore.ObjectStoreReference:
        with NamedTemporaryFile(mode='w+', encoding='utf-8', prefix='detected-faces-', suffix='.json', delete=True, delete_on_close=True) as out_file:
            print('Writing output to: ', out_file.name)
            json_str = json.dumps(obj=faces)

            out_file.write(json_str)
            out_file.flush()

            target_ref.object_size_bytes = out_file.file.tell()
            s3_resource = objstore.s3.create_resource(target_ref)
            return objstore.s3.upload_file(s3_resource, out_file.name, target_ref)

    def detect_faces(self, req: DetectFacesRequest) -> tuple[DetectedFacesInVideo, DetectFacesSuccessResponse]:
        video: cv2.VideoCapture | None = None
        try:
            video = self.open_video(req.input)
            width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
            if width == 0 or height == 0:
                raise Exception('Silent error when opening video (width and height are zero)')
            fps = video.get(cv2.CAP_PROP_FPS)
            faces = find_faces(video)
            return faces, {
                'success': True,
                'video': req.input.object_key,
                'width': width,
                'height': height,
                'fps': fps,
                'framesWithFaces': len(faces['detected']),
                'output': None,
            }
        finally:
            if video is not None:
                video.release()


    def process_request(self, http_req: Request) -> tuple[dict[str, Any], int]:
        try:
            req = DetectFacesRequest.from_dict(http_req.get_json())
            faces, response = self.detect_faces(req)

            target_ref = self.generate_target_obj_ref(req.input)
            response['output']  = self.save_output(faces, target_ref)
            print('Uploaded results to bucket: ', response['output'].bucket, ', object: ', response['output'].object_key)

            return cast(dict[str, Any], response), 200
        except Exception as ex:
            return util.report_exception(ex), 500


def main(context: Context):
    print("Received request")

    if 'request' in context.keys():
        timer = util.Stopwatch()
        timer.start()
        handler = DetectFacesRequestHandler()
        response, status_code = handler.process_request(context.request)
        timer.stop()
        return {
            'result': response,
            'durationMs': timer.totalElapsedMs,
        }, status_code
    else:
        print("Empty request", flush=True)
        return util.rest.report_invalid_video_request('DetectFaces'), 400
