import argparse
import cv2
import stopwatch
from local_face_recognizer import find_faces

def main(input_file: str, output_file: str):
    # Open the input video and get its metadata.
    video = cv2.VideoCapture(input_file)
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = video.get(cv2.CAP_PROP_FPS)

    # Create the output writer
    fourcc = cv2.VideoWriter.fourcc('X', 'V', 'I', 'D')
    output = cv2.VideoWriter(output_file, fourcc, fps, (width, height), True)

    # Run the face recognition
    stopw = stopwatch.Stopwatch()
    stopw.start()
    find_faces(video, output)
    stopw.stop()

    output.release()
    video.release()

    print('Face recognition took ', stopw.totalElapsed, 'seconds')



if __name__ == '__main__':
    args_parser = argparse.ArgumentParser('Face recognizer', 'python main.py ./input-video.mp4 ./output-video.avi')
    args_parser.add_argument('input')
    args_parser.add_argument('output')
    args = args_parser.parse_args()

    if args.input is None or args.output is None:
        args_parser.print_usage()
        exit(1)

    output: str = args.output
    if not output.lower().endswith('.avi'):
        print('Output must be an .avi file')
        exit(1)

    main(args.input, args.output)
