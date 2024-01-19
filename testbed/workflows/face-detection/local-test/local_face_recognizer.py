import cv2
import stopwatch

def find_faces(inputVideo: cv2.VideoCapture, output: cv2.VideoWriter) -> None:
    reading = stopwatch.Stopwatch()
    transformation = stopwatch.Stopwatch()
    logging = stopwatch.Stopwatch()
    face_recog = stopwatch.Stopwatch()
    drawing = stopwatch.Stopwatch()
    encoding = stopwatch.Stopwatch()

    face_cascade = cv2.CascadeClassifier()
    if not face_cascade.load('.venv/lib64/python3.12/site-packages/cv2/data/haarcascade_frontalface_alt.xml'):
        raise Exception('Could not load classifier model')

    while True:
        # Grab a single frame of the video
        reading.start()
        ok, frame = inputVideo.read()
        reading.stop()
        if not ok:
            break

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

        drawing.start()
        for (x, y, w, h) in face_locations:
            # Draw a box around the face
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
        drawing.stop()

        # Write the frame to the output queue
        encoding.start()
        output.write(frame)
        encoding.stop()

    print('Reading: ', reading.totalElapsed)
    print('transformation: ', transformation.totalElapsed)
    print('face_recog: ', face_recog.totalElapsed)
    print('drawing: ', drawing.totalElapsed)
    print('encoding: ', encoding.totalElapsed)
    print('Logging: ', logging.totalElapsed)
