import { Context, HTTPFunction, HealthCheck, IncomingBody, StructuredReturn } from 'faas-js-runtime';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import { ObjectStoreReference } from './object-store';
import { createS3ObjectStoreClient } from './object-store/impl/factories';
import { createErrorResponse, reportInvalidVideoRequest } from './util';
import { FFmpegLog, DetectFacesRequest, VideoProcessingResponse, isValidDetectFacesRequest } from './video';

const OUTPUT_BUCKET = 'output';
// We deliberately choose parameters that will make encoding slower, because we don't want the face detection function to make up 95% of the workflow.
const FFMPEG_VIDEO_PRESET = '-vf scale=-1:360:flags=lanczos -c:v libx264 -preset medium -crf 16';
const FFMPEG_AUDIO_PRESET = '-c:a aac -b:a 96k';

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
    if (!isValidDetectFacesRequest(body)) {
        return reportInvalidVideoRequest('DetectFacesRequest');
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

async function processVideoFile(req: DetectFacesRequest): Promise<VideoProcessingResponse> {
    const s3Client = createS3ObjectStoreClient(req.input);
    const srcUrl = await s3Client.createPresignedReadUrl(req.input);
    const tempFilePath = getTempFilePath('mp4');

    try {
        const ffmpegLog = await transformVideo(req, srcUrl, tempFilePath);
        let targetObjRef = createTargetObjRef(req.input);
        targetObjRef = await s3Client.uploadFile(tempFilePath, targetObjRef);

        return {
            ffmpegLog,
            output: targetObjRef,
        };
    } finally {
        fs.rmSync(tempFilePath, { force: true });
    }
}

function transformVideo(req: DetectFacesRequest, srcUrl: string, targetFile: string): Promise<FFmpegLog> {
    const ffmpegArgs = `-i "${srcUrl}" ${FFMPEG_VIDEO_PRESET} ${FFMPEG_AUDIO_PRESET} -f mp4 "${targetFile}"`;
    return new Promise((resolve, reject) => {
        exec(`"${ffmpegPath}" ${ffmpegArgs}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }

            console.log('Encoding finished');
            resolve({
                statusCode: 0,
                log: stderr,
            });
        });
    });
}

function createTargetObjRef(baseObjRef: ObjectStoreReference): ObjectStoreReference {
    const targetFileName = randomUUID();
    const targetObjRef: ObjectStoreReference = {
        ...baseObjRef,
        bucket: OUTPUT_BUCKET,
        objectKey: `${targetFileName}.mp4`,
        objectSizeBytes: 0,
    };
    return targetObjRef;
}

function getTempFilePath(extension: string): string {
    let tmpFile: string;
    do {
        tmpFile = `/tmp/${randomUUID()}.${extension}`;
    } while (fs.existsSync(tmpFile));
    return tmpFile;
}

export { handle, liveness, readiness };
