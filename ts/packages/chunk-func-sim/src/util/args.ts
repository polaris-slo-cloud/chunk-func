
/**
 * Converts command line arguments into an options object with string keys and number values.
 *
 * Example:
 *   - `args = [ '--paramA', '4', '--paramB', '10' ]`
 *   - `output = { 'paramA': 4, 'paramB': 10 }`
 */
export function convertArgsToOptions(args: string[]): Record<string, number> {
    if (args.length % 2 !== 0) {
        throw new Error(`args has an uneven length: ${args.length}.`);
    }

    const options: Record<string, number> = {};
    for (let i = 0; i < args.length; i = i + 2) {
        const key = parseKey(args[i]);
        const value = parseValue(key, args[i + 1]);
        options[key] = value;
    }

    return options;
}

function parseKey(argStr: string): string {
    if (!argStr.startsWith('--') || argStr.length < 3) {
        throw new Error(`Unknown parameter: ${argStr}`);
    }
    return argStr.substring(2);
}

function parseValue(key: string, valueStr: string): number {
    const value = parseFloat(valueStr);
    if (Number.isNaN(value)) {
        throw new Error(`The value for ${key} is not a number: ${valueStr}`);
    }
    return value;
}
