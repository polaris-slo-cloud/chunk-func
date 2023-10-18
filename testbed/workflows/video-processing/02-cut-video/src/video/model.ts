import { ObjectStoreReference, isValidObjectStoreReference } from '../object-store';

const VIDEO_TIMESTAMP_REGEX = /\d\d\:\d\d\:\d\d/;

export interface VideoSegment {
    /** The start timestamp in the format hh:mm:ss */
    start: string;

    /** The end timestamp in the format hh:mm:ss */
    end: number;
}

export interface VideoCutRequest {
    input: ObjectStoreReference;
    segmentA: VideoSegment;
    segmentB: VideoSegment;
}

function isValidVideoSegment(obj: any): obj is VideoSegment {
    let isValid = typeof obj.start === 'string';
    isValid = isValid && !!(obj.start as string).match(VIDEO_TIMESTAMP_REGEX);
    isValid = isValid && typeof obj.end === 'string';
    isValid = isValid && !!(obj.end as string).match(VIDEO_TIMESTAMP_REGEX);
    return isValid;
}

export function isValidVideoCutRequest(obj: any): obj is VideoCutRequest {
    let isValid = typeof obj.input === 'object';
    isValid = isValid && typeof obj.segmentA === 'object';
    isValid = isValid && typeof obj.segmentB === 'object';
    isValid = isValid && isValidObjectStoreReference(obj.input);
    isValid = isValid && isValidVideoSegment(obj.segmentA);
    isValid = isValid && isValidVideoSegment(obj.segmentB);
    return isValid;
}
