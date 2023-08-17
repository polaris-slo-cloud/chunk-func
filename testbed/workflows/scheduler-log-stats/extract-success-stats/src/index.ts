import { Context, HTTPFunction, HealthCheck, IncomingBody, StructuredReturn } from 'faas-js-runtime';
import { isValidObjectStoreReference, ObjectReader, ObjectStoreReference } from './object-store';
import { createS3ObjectStoreClient } from './object-store/impl/factories';
import { createErrorResponse, reportInvalidS3ObjRef } from './util';

interface SuccessLogStatistics {
    schedulingSuccesses: number;
    avgQueuingTimeSuccesses: number;
    avgSamplingDurationSuccesses: number;
    avgCommitDuration: number;
    avgE2EDuration: number;
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
    if (!isValidObjectStoreReference(body)) {
        return reportInvalidS3ObjRef();
    }
    console.log('Received request');

    let stats: SuccessLogStatistics;
    try {
        stats = await extractStatistics(body);
    } catch (err) {
        return createErrorResponse(err as Error);
    }

    const end = new Date();
    const durationMs = end.valueOf() - start.valueOf();
    console.log('Request completed in (ms):', durationMs);

    return {
        statusCode: 200,
        body: {
            statistics: stats,
            durationMs: durationMs,
        },
        headers: {
            'content-type': 'application/json',
        },
    };
};

async function extractStatistics(objRef: ObjectStoreReference): Promise<SuccessLogStatistics> {
    const s3Client = createS3ObjectStoreClient(objRef);
    const reader = await s3Client.createObjectReader(objRef);
    return extractStatsInternal(reader);
}

function extractStatsInternal(reader: ObjectReader): Promise<SuccessLogStatistics> {
    const stats: SuccessLogStatistics = {
        schedulingSuccesses: 0,
        avgQueuingTimeSuccesses: 0,
        avgSamplingDurationSuccesses: 0,
        avgCommitDuration: 0,
        avgE2EDuration: 0,
    };

    const successesRegex = /"SchedulingSuccess"/;
    const queuingTimeRegex = /^.+queueTimeMs"=([0-9]+)\s.+/;
    const samplingDurationRegex = /^.+samplingDurationMs"=([0-9]+)\s.+/;
    const commitDurationRegex = /^.+commitDurationMs"=([0-9]+)\s.+/;
    const e2eDurationRegex = /^.+e2eDurationMs"=([0-9]+)\s.+/;

    return new Promise((resolve, reject) => {
        const rl = reader.readLineByLine();

        rl.onLineRead(line => {
            if (line.match(successesRegex)) {
                ++stats.schedulingSuccesses;
                stats.avgQueuingTimeSuccesses += extractNumber(line, queuingTimeRegex);
                stats.avgSamplingDurationSuccesses += extractNumber(line, samplingDurationRegex);
                stats.avgCommitDuration += extractNumber(line, commitDurationRegex);
                stats.avgE2EDuration += extractNumber(line, e2eDurationRegex);
            }
            return true;
        });

        rl.onError(err => reject(err));

        rl.onEnd(() => {
            console.log('Finished reading object.');

            if (stats.schedulingSuccesses > 0) {
                stats.avgQueuingTimeSuccesses /= stats.schedulingSuccesses;
                stats.avgSamplingDurationSuccesses /= stats.schedulingSuccesses;
                stats.avgCommitDuration /= stats.schedulingSuccesses;
                stats.avgE2EDuration /= stats.schedulingSuccesses;
            }

            resolve(stats);
        });
    });
}

function extractNumber(line: string, regex: RegExp): number {
    const result = regex.exec(line);
    if (result && result.length > 0) {
        const value = +result[1];
        return value;
    }
    return 0;
}

export { handle, liveness, readiness };
