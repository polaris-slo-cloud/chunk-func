from parliament import Context
from flask import Request
import cv2
from typing import Any, cast
import util
import objstore
import json
import uuid
from tempfile import NamedTemporaryFile, mktemp
from video import MarkFacesRequest, DetectedFacesInVideo, mark_faces, MarkFacesSuccessResponse

OUTPUT_BUCKET = 'output'

print('mark-faces function starting')

class MarkFacesRequestHandler:

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
            object_key=f'{input.object_key}-marked-{uuid.uuid1()}.avi',
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

    def create_output_video_writer(self, path: str, width: int, height: int, fps: float) -> cv2.VideoWriter:
        fourcc = cv2.VideoWriter.fourcc('X', 'V', 'I', 'D')
        return cv2.VideoWriter(path, fourcc, fps, (width, height), True)

    def mark_faces(self, req: MarkFacesRequest, detected_faces: DetectedFacesInVideo) -> tuple[str, MarkFacesSuccessResponse]:
        input_video: cv2.VideoCapture | None = None
        output_video: cv2.VideoWriter | None = None

        try:
            input_video = self.open_video(req.input)
            width = int(input_video.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(input_video.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = input_video.get(cv2.CAP_PROP_FPS)
            if width == 0 or height == 0:
                raise Exception('Silent error when opening video (width and height are zero)')

            dest = mktemp() + '.avi'
            output_video = self.create_output_video_writer(dest, width, height, fps)
            mark_faces(input_video, detected_faces, output_video)

            return dest, {
                'success': True,
                'output': None,
            }
        finally:
            if input_video is not None:
                input_video.release()
            if output_video is not None:
                output_video.release();

    def load_detected_faces(self, faces_json_ref: objstore.ObjectStoreReference, s3_resource) -> DetectedFacesInVideo:
        temp_file = mktemp()
        objstore.s3.download_file(s3_resource, faces_json_ref, temp_file)
        with open(temp_file) as file:
            ret = json.load(file)
            return cast(DetectedFacesInVideo, ret)

    def process_request(self, http_req: Request) -> tuple[dict[str, Any], int]:
        try:
            req = MarkFacesRequest.from_dict(http_req.get_json())
            s3_resource = objstore.s3.create_resource(req.input)

            detected_faces = self.load_detected_faces(req.faces, s3_resource)
            out_file, response = self.mark_faces(req, detected_faces)
            print('Finished marking faces', out_file)

            target_ref = self.generate_target_obj_ref(req.input)
            response['output']  = objstore.s3.upload_file(s3_resource, out_file, target_ref)
            print('Uploaded final video to bucket: ', response['output'].bucket, ', object: ', response['output'].object_key)

            return cast(dict[str, Any], response), 200
        except Exception as ex:
            return util.report_exception(ex), 500


def main(context: Context):
    print("Received request")

    if 'request' in context.keys():
        timer = util.Stopwatch()
        timer.start()
        handler = MarkFacesRequestHandler()
        response, status_code = handler.process_request(context.request)
        timer.stop()
        return {
            'result': response,
            'durationMs': timer.totalElapsedMs,
        }, status_code
    else:
        print("Empty request", flush=True)
        return util.rest.report_invalid_video_request('MarkFaces'), 400
