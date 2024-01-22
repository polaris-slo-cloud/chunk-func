import cv2
from .model import DetectedFacesInFrame, DetectedFacesInVideo

DETECTION_VIDEO_WIDTH = 1280
DETECTION_VIDEO_HEIGHT = 720

def mark_faces(input_video: cv2.VideoCapture, detected_faces: DetectedFacesInVideo, output_video: cv2.VideoWriter) -> None:
    width = int(input_video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(input_video.get(cv2.CAP_PROP_FRAME_HEIGHT))
    scale_x = width / DETECTION_VIDEO_WIDTH
    scale_y = height / DETECTION_VIDEO_HEIGHT

    faces_iter = iter(detected_faces['detected'])
    next_faces: DetectedFacesInFrame | None = next(faces_iter, None)
    frame_index = -1
    faces_marked = 0

    while True:
        # Grab a single frame of the video
        ok, frame = input_video.read()
        if not ok:
            break
        frame_index += 1

        # If the current frame matches the one, where the next faces have been detected,
        # draw a rectangle around each face.
        if next_faces is not None and frame_index == next_faces['frame']:
            faces = next_faces['faces']
            for face_rect in faces:
                x = int(face_rect['x'] * scale_x)
                width = int(face_rect['width'] * scale_x)
                y = int(face_rect['y'] * scale_y)
                height = int(face_rect['height'] * scale_y)
                cv2.rectangle(frame, (x, y), (x + width, y + height), (0, 0, 255), 2)
                faces_marked += 1
            next_faces = next(faces_iter, None)

        # Write the frame to the output video
        output_video.write(frame)

    print('Marked ', faces_marked, ' faces in ', frame_index + 1, ' frames.')
