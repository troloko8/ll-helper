export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 50
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,48}[a-z0-9])$/

export const normalizeUsername = (username: string) =>
    username.trim().toLowerCase()

export const isUsernameSlug = (username: string) =>
    USERNAME_PATTERN.test(username)
