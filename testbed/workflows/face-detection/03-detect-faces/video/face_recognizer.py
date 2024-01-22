import cv2
from importlib import resources
import util
from .model import DetectedFacesInFrame, DetectedFacesInVideo, Rectangle

def find_faces(inputVideo: cv2.VideoCapture) -> DetectedFacesInVideo:
    reading = util.Stopwatch()
    transformation = util.Stopwatch()
    logging = util.Stopwatch()
    face_recog = util.Stopwatch()
    results_collection = util.Stopwatch()

    face_cascade = cv2.CascadeClassifier()
    with resources.path(cv2, 'data') as data_dir_path:
        model_path = str(data_dir_path) + '/haarcascade_frontalface_alt.xml'
        if not face_cascade.load(model_path):
            raise Exception('Could not load classifier model')

    frame_index = -1
    detected_faces: list[DetectedFacesInFrame] = []

    while True:
        # Grab a single frame of the video
        reading.start()
        ok, frame = inputVideo.read()
        reading.stop()
        if not ok:
            break
        frame_index += 1

        # Convert the image to grayscale
        transformation.start()
        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        frame_gray = cv2.equalizeHist(frame_gray)
        transformation.stop()

        # Find all faces in the current frame
        face_recog.start()
        face_locations = face_cascade.detectMultiScale(frame_gray)
        face_recog.stop()

        logging.start()
        print(face_locations)
        logging.stop()

        results_collection.start()
        face_rects: list[Rectangle] = []
        for (x, y, w, h) in face_locations:
            face_rects.append({'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h) })
        detected_faces.append({'frame': frame_index, 'faces': face_rects})
        results_collection.stop()

    print('Reading: ', reading.totalElapsed)
    print('transformation: ', transformation.totalElapsed)
    print('face_recog: ', face_recog.totalElapsed)
    print('results_collection: ', results_collection.totalElapsed)
    print('Logging: ', logging.totalElapsed)
    print(f'Detected faces in {len(detected_faces)} of {frame_index + 1} frames')

    return {'detected': detected_faces}
