import cv2
import stopwatch
from local_face_recognizer import find_faces

# Open the input video and get its metadata.
video = cv2.VideoCapture('./assets/video_of_people_walking.mp4')
width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = video.get(cv2.CAP_PROP_FPS)

# Create the output writer
fourcc = cv2.VideoWriter.fourcc('X', 'V', 'I', 'D')
output = cv2.VideoWriter('./test.avi', fourcc, fps, (width, height), True)

# Run the face recognition
stopw = stopwatch.Stopwatch()
stopw.start()
find_faces(video, output)
stopw.stop()

output.release()
video.release()

print('Face recognition took ', stopw.totalElapsed, 'seconds')
