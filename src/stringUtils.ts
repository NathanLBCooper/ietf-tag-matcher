export function isNullOrWhitespace(value: string | undefined | null): boolean {
    return value == null || !/\S/.test(value);
}
