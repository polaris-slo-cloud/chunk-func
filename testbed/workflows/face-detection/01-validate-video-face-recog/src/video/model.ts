import { ObjectStoreReference, isValidObjectStoreReference } from '../object-store';

export interface FFmpegLog {
    statusCode: number;
    log: string;
}

export interface DetectFacesRequest {
    input: ObjectStoreReference;
}

export interface VideoProcessingResponse {
    ffmpegLog: FFmpegLog;
    output: ObjectStoreReference;
}

export function isValidDetectFacesRequest(obj: any): obj is DetectFacesRequest {
    if (!obj) {
        return false;
    }

    const req = obj as Partial<DetectFacesRequest>;
    return isValidObjectStoreReference(req.input);
}
