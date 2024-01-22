import { Context, HTTPFunction, HealthCheck, IncomingBody, StructuredReturn } from 'faas-js-runtime';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'node:child_process';
import { createS3ObjectStoreClient } from './object-store/impl/factories';
import { createErrorResponse, reportInvalidVideoRequest } from './util';
import { FFmpegLog, VideoEditRequest, isValidVideoEditRequest } from './video';

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
    if (!isValidVideoEditRequest(body)) {
        return reportInvalidVideoRequest('VideoEditRequest');
    }

    let log: FFmpegLog;
    try {
        log = await processVideoFile(body);
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
            ffmpegLog: log,
            durationMs: durationMs,
        },
        headers: {
            'content-type': 'application/json',
        },
    };
};

async function processVideoFile(req: VideoEditRequest): Promise<FFmpegLog> {
    const s3Client = createS3ObjectStoreClient(req.input);
    const readUrl = await s3Client.createPresignedReadUrl(req.input);
    return extractVideoStats(req, readUrl);
}

function extractVideoStats(req: VideoEditRequest, readUrl: string): Promise<FFmpegLog> {
    return new Promise((resolve, reject) => {
        const proc = exec(`"${ffmpegPath}" -i "${readUrl}" /dev/null`, (error, stdout, stderr) => {
            // we only want to get file information here. ffmpeg will always exit with an error in this setup.
            resolve({
                statusCode: 0,
                log: stderr,
            });
        });
    });
}

export { handle, liveness, readiness };
