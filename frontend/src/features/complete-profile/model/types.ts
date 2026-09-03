export interface CreateUserRequestDto {
    firstName: string
    lastName: string
    username: string
    nativeLanguage: string
    targetLanguage: string
    avatarUrl: string | null
    uiLanguage: string
}
