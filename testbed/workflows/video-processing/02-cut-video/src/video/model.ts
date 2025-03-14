import { ObjectStoreReference, isValidObjectStoreReference } from '../object-store';

const VIDEO_TIMESTAMP_REGEX = /\d\d:\d\d:\d\d/;

export interface FFmpegLog {
    statusCode: number;
    log: string;
}

export interface VideoSegment {
    /** The start timestamp in the format hh:mm:ss */
    start: string;

    /** The end timestamp in the format hh:mm:ss */
    end: string;
}

/**
 * A request for cutting multiple segments from a video and, subsequently, merging them.
 */
export interface VideoEditRequest {
    input: ObjectStoreReference;
    segments: VideoSegment[];

    /** Encoding quality in the range 0-63 */
    quality: number;
}

/**
 * A request for cutting a single segment from a video and saving it to a file.
 */
export interface VideoCutRequest {
    input: ObjectStoreReference;
    segment: VideoSegment;

    /** Encoding quality in the range 0-63 */
    quality: number;
}

export interface VideoProcessingResponse {
    ffmpegLog: FFmpegLog;
    output: ObjectStoreReference;
}

/**
 * A request for merging multiple video files.
 */
export interface VideoMergeRequest {
    input: ObjectStoreReference[];
}

function isValidVideoSegment(obj: any): obj is VideoSegment {
    if (!obj) {
        return false;
    }

    const seg = obj as Partial<VideoSegment>;
    let isValid = typeof seg.start === 'string';
    isValid = isValid && !!seg.start!.match(VIDEO_TIMESTAMP_REGEX);
    isValid = isValid && typeof seg.end === 'string';
    isValid = isValid && !!seg.end!.match(VIDEO_TIMESTAMP_REGEX);
    return isValid;
}

export function isValidVideoEditRequest(obj: any): obj is VideoEditRequest {
    if (!obj) {
        return false;
    }

    const req = obj as Partial<VideoEditRequest>;
    let isValid = isValidObjectStoreReference(req.input);
    isValid = isValid && typeof req.quality === 'number';
    isValid = isValid && req.quality! >= 0 && req.quality! <= 63;
    isValid = isValid && Array.isArray(req.segments) && req.segments.length > 0;
    if (isValid) {
        for (const segment of req.segments!) {
            isValid = isValid && isValidVideoSegment(segment);
        }
    }
    return isValid;
}

export function isValidVideoCutRequest(obj: any): obj is VideoCutRequest {
    if (!obj) {
        return false;
    }

    const req = obj as Partial<VideoCutRequest>;
    let isValid = isValidObjectStoreReference(req.input);
    isValid = isValid && isValidVideoSegment(req.segment);
    isValid = isValid && typeof req.quality === 'number';
    isValid = isValid && req.quality! >= 0 && req.quality! <= 63;
    return isValid;
}

export function isValidVideoMergeRequest(obj: any): obj is VideoMergeRequest {
    if (!obj) {
        return false;
    }

    const req = obj as Partial<VideoMergeRequest>;
    let isValid = Array.isArray(req.input) && req.input.length > 0;
    const firstSegment = req.input![0];
    if (isValid) {
        for (const segment of req.input!) {
            isValid = isValid && isValidObjectStoreReference(segment);
            isValid = isValid && segment.url === firstSegment.url;
            isValid = isValid && segment.user === firstSegment.user;
            isValid = isValid && segment.password === firstSegment.password;
        }
    }
    return isValid;
}
