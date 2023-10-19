import { Context, HTTPFunction, HealthCheck, IncomingBody, StructuredReturn } from 'faas-js-runtime';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'node:child_process';
import { createS3ObjectStoreClient } from './object-store/impl/factories';
import { createErrorResponse, reportInvalidVideoRequest } from './util';
import { VideoCutRequest, VideoProcessingResponse, isValidVideoCutRequest } from './video';
import { ObjectStoreReference } from './object-store';
import { randomUUID } from 'node:crypto';

const FFMPEG_VIDEO_PRESET = '-vf scale=640:-1 -c:v libx264 -preset veryfast -crf 35';
const FFMPEG_AUDIO_PRESET = '-c:a aac -b:a 128k';

interface FFmpegLog {
    statusCode: number;
    log: string;
}

const liveness: HealthCheck = () => {
    return {
        status: 200,
        statusMessage: 'OK',
    };
};

const readiness: HealthCheck = () => {
    return {
        status: 200,
        statusMessage: 'OK',
    };
};

const handle: HTTPFunction = async (context: Context, body?: IncomingBody): Promise<StructuredReturn> => {
    const start = new Date();
    if (!isValidVideoCutRequest(body)) {
        return reportInvalidVideoRequest('VideoCutRequest');
    }

    let result: VideoProcessingResponse;
    try {
        result = await processVideoFile(body);
    } catch (err) {
        console.error(err);
        return createErrorResponse(err as Error);
    }

    const end = new Date();
    const durationMs = end.valueOf() - start.valueOf();
    console.log('Request completed in (ms):', durationMs);

    return {
        statusCode: 200,
        body: {
            result,
            durationMs: durationMs,
        },
        headers: {
            'content-type': 'application/json',
        },
    };
};

async function processVideoFile(req: VideoCutRequest): Promise<VideoProcessingResponse> {
    const s3Client = createS3ObjectStoreClient(req.input);
    const readUrl = await s3Client.createPresignedReadUrl(req.input);
    const targetObjRef = createTargetObjRef(req.input);
    const writeUrl = await s3Client.createPresignedWriteUrl(targetObjRef);
    return cutVideo(req, readUrl, writeUrl, targetObjRef);
}

function cutVideo(req: VideoCutRequest, readUrl: string, writeUrl: string, targetObjRef: ObjectStoreReference): Promise<VideoProcessingResponse> {
    const ffmpegArgs = `-i "${readUrl}" -ss ${req.segment.start} -to ${req.segment.end} ${FFMPEG_VIDEO_PRESET} ${FFMPEG_AUDIO_PRESET} -f mp4 "${writeUrl}"`;
    return new Promise((resolve, reject) => {
        const proc = exec(`"${ffmpegPath}" ${ffmpegArgs}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }

            resolve({
                ffmpegLog: {
                    statusCode: 0,
                    log: stdout,
                },
                output: targetObjRef,
            });
        });
    });
}

function createTargetObjRef(baseObjRef: ObjectStoreReference): ObjectStoreReference {
    const targetFileName = randomUUID();
    const targetObjRef: ObjectStoreReference = {
        ...baseObjRef,
        objectKey: `${targetFileName}.mp4`,
    };
    return targetObjRef;
}

export { handle, liveness, readiness };
