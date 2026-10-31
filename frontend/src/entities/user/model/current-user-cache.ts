export const CURRENT_USER_STALE_AFTER_MS = 5 * 60 * 1_000

export function isCurrentUserStale(
    fulfilledTimeStamp: number | undefined,
    now = Date.now(),
): boolean {
    return (
        fulfilledTimeStamp !== undefined &&
        now - fulfilledTimeStamp >= CURRENT_USER_STALE_AFTER_MS
    )
}
