import { describe, expect, it } from 'vitest'
import { completeProfileFormSchema } from './complete-profile-form-schema'

const validProfile = {
    firstName: 'Jane',
    lastName: 'Doe',
    username: 'jane_doe',
    nativeLanguage: 'en',
    targetLanguage: 'ja',
    uiLanguage: 'zh-CN',
}

describe('completeProfileFormSchema', () => {
    it('accepts a profile that satisfies the backend contract', () => {
        expect(completeProfileFormSchema.safeParse(validProfile).success).toBe(
            true,
        )
    })

    it.each([
        ['firstName', 'x'],
        ['firstName', 'x'.repeat(101)],
        ['lastName', ' '],
        ['username', 'ab'],
        ['username', 'x'.repeat(51)],
    ] as const)('rejects an invalid %s boundary', (field, value) => {
        expect(
            completeProfileFormSchema.safeParse({
                ...validProfile,
                [field]: value,
            }).success,
        ).toBe(false)
    })

    it.each([
        ['nativeLanguage', 'e'],
        ['nativeLanguage', 'english'],
        ['targetLanguage', 'en-US-extra'],
        ['uiLanguage', 'en_Us'],
        ['uiLanguage', '   '],
    ] as const)('rejects an invalid %s code', (field, value) => {
        expect(
            completeProfileFormSchema.safeParse({
                ...validProfile,
                [field]: value,
            }).success,
        ).toBe(false)
    })
})
