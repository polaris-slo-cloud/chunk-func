import cv2
import face_recognition
import stopwatch

def find_faces(inputVideo: cv2.VideoCapture, output: cv2.VideoWriter) -> None:
    reading = stopwatch.Stopwatch()
    transformation = stopwatch.Stopwatch()
    logging = stopwatch.Stopwatch()
    face_recog = stopwatch.Stopwatch()
    drawing = stopwatch.Stopwatch()
    encoding = stopwatch.Stopwatch()

    while True:
        # Grab a single frame of the video
        reading.start()
        ok, frame = inputVideo.read()
        reading.stop()
        if not ok:
            break

        # Convert the image from BGR color (used by OpenCV) to RGB color (used by face_recognition)
        transformation.start()
        rgb_frame = frame[:, :, ::-1]
        transformation.stop()

        # Find all faces in the current frame
        face_recog.start()
        face_locations = face_recognition.face_locations(rgb_frame)
        face_recog.stop()

        logging.start()
        print(face_locations)
        logging.stop()

        drawing.start()
        for top, right, bottom, left in face_locations:
            # Draw a box around the face
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)
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
