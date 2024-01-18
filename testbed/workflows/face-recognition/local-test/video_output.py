import cv2
from multiprocessing import Queue

def save_video_from_queue(filename: str, fps: float, frame_size: cv2.typing.Size, queue: Queue) -> None:
    fourcc = cv2.VideoWriter.fourcc('X', 'V', 'I', 'D')
    output = cv2.VideoWriter(filename, fourcc, fps, frame_size, True)

    print("Video encoder started for ", filename)

    # Read frames from queue and write them to the output until the queue is closed.
    while True:
        try:
            frame: cv2.typing.MatLike = queue.get(True)
            output.write(frame)
        except Exception as ex:
            print(ex)
            print("Stopping video encoder")
            output.release()
