import { Context, HTTPFunction, HealthCheck, IncomingBody, StructuredReturn } from 'faas-js-runtime';
import { isValidObjectStoreReference, ObjectReader, ObjectStoreReference } from './object-store';
import { createS3ObjectStoreClient } from './object-store/impl/factories';
import { createErrorResponse, reportInvalidS3ObjRef } from './util';

interface BasicLogStatistics {
    schedulingSuccesses: number;
    schedulingFailuresInclRetries: number;
    schedulingFailuresFinal: number;
    schedulingConflicts: number;
    schedulingConflictsNoMultiBind: number;
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

    let stats: BasicLogStatistics;
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

async function extractStatistics(objRef: ObjectStoreReference): Promise<BasicLogStatistics> {
    const s3Client = createS3ObjectStoreClient(objRef);
    const reader = await s3Client.createObjectReader(objRef);
    return extractStatsInternal(reader);
}

function extractStatsInternal(reader: ObjectReader): Promise<BasicLogStatistics> {
    const stats: BasicLogStatistics = {
        schedulingSuccesses: 0,
        schedulingFailuresInclRetries: 0,
        schedulingFailuresFinal: 0,
        schedulingConflicts: 0,
        schedulingConflictsNoMultiBind: 0,
    };

    const successesRegex = /"SchedulingSuccess"/;
    const failuresInclRetriesRegex = /"FailedScheduling".+"reason"=/;
    const failuresFinalRegex = /"FailedScheduling".+"reason"=.+"retryingScheduling"=false/;
    const conflictsRegex = /"FailedScheduling".+"reasons"=/;
    const conflictsNoMultiBindRegex = /"SchedulingSuccess".+"commitRetries"=[1-3]/;

    return new Promise((resolve, reject) => {
        const rl = reader.readLineByLine();
        rl.onLineRead(line => {
            if (line.match(successesRegex)) {
                ++stats.schedulingSuccesses;
            }
            if (line.match(failuresInclRetriesRegex)) {
                ++stats.schedulingFailuresInclRetries;
            }
            if (line.match(failuresFinalRegex)) {
                ++stats.schedulingFailuresFinal;
            }
            if (line.match(conflictsRegex)) {
                ++stats.schedulingConflicts;
            }
            if (line.match(conflictsNoMultiBindRegex)) {
                ++stats.schedulingConflictsNoMultiBind;
            }
            return true;
        });
        rl.onError(err => reject(err));
        rl.onEnd(() => {
            console.log('Finished reading object.');
            resolve(stats);
        });
    });
}

export { handle, liveness, readiness };
