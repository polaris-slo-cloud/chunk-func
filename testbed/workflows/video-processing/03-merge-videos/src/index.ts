import { Context, HTTPFunction, HealthCheck, IncomingBody, StructuredReturn } from 'faas-js-runtime';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import { ObjectStoreClient, ObjectStoreReference } from './object-store';
import { createS3ObjectStoreClient } from './object-store/impl/factories';
import { createErrorResponse, reportInvalidVideoRequest } from './util';
import { FFmpegLog, VideoMergeRequest, VideoProcessingResponse, isValidVideoMergeRequest } from './video';

const OUTPUT_BUCKET = 'output';

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
    if (!isValidVideoMergeRequest(body)) {
        return reportInvalidVideoRequest('VideoMergeRequest');
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

async function processVideoFile(req: VideoMergeRequest): Promise<VideoProcessingResponse> {
    const s3Client = createS3ObjectStoreClient(req.input[0]);
    const srcUrlsListFile = await createSourceUrlsListFile(req, s3Client);
    const destFile = getTempFilePath('mp4');

    try {
        const ffmpegLog = await mergeVideos(srcUrlsListFile, destFile);
        let targetObjRef = createTargetObjRef(req.input[0]);
        targetObjRef = await s3Client.uploadFile(destFile, targetObjRef);

        return {
            ffmpegLog,
            output: targetObjRef,
        };
    } finally {
        fs.rmSync(srcUrlsListFile, { force: true });
        fs.rmSync(destFile, { force: true });
    }
}

function mergeVideos(srcUrlsListFile: string, destFile: string): Promise<FFmpegLog> {
    const ffmpegArgs = `-f concat -safe 0 -protocol_whitelist file,http,tcp -i "${srcUrlsListFile}" -c copy "${destFile}"`;

    return new Promise((resolve, reject) => {
        exec(`"${ffmpegPath}" ${ffmpegArgs}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }

            console.log('Merging finished');
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

async function createSourceUrlsListFile(req: VideoMergeRequest, s3Client: ObjectStoreClient): Promise<string> {
    const srcUrls$ = req.input.map(objRef => s3Client.createPresignedReadUrl(objRef));
    const srcUrls = await Promise.all(srcUrls$);
    const srcUrlsList = srcUrls.map(url => `file '${url}'`).join('\n');

    const tempFilePath = getTempFilePath('txt');
    fs.writeFileSync(tempFilePath, srcUrlsList);
    return tempFilePath;
}

function getTempFilePath(extension: string): string {
    let tmpFile: string;
    do {
        tmpFile = `/tmp/${randomUUID()}.${extension}`;
    } while (fs.existsSync(tmpFile));
    return tmpFile;
}

export { handle, liveness, readiness };
