import type { CompleteProfileFormProps } from '@/features/complete-profile'
import { CompleteProfileForm } from '@/features/complete-profile'
import { PublicFormLayout } from '@/widgets/public-form-layout'
import styles from './complete-profile-page.module.css'

export type CompleteProfilePageProps = Pick<
    CompleteProfileFormProps,
    'onSuccess'
>

function PsychologyIcon() {
    return (
        <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
            <path d="M240-80v-172q-57-52-88.5-121.5T120-520q0-150 105-255t255-105q125 0 221.5 73.5T827-615l52 205q5 19-7 34.5T840-360h-80v120q0 33-23.5 56.5T680-160h-80v80h-80v-160h160v-200h108l-38-155q-23-91-98-148t-172-57q-116 0-198 81t-82 197q0 60 24.5 114t69.5 96l26 24v208h-80Zm254-360Zm-54 80h80l6-50q8-3 14.5-7t11.5-9l46 20 40-68-40-30q2-8 2-16t-2-16l40-30-40-68-46 20q-5-5-11.5-9t-14.5-7l-6-50h-80l-6 50q-8 3-14.5 7t-11.5 9l-46-20-40 68 40 30q-2 8-2 16t2 16l-40 30 40 68 46-20q5 5 11.5 9t14.5 7l6 50Zm40-100q-25 0-42.5-17.5T420-520q0-25 17.5-42.5T480-580q25 0 42.5 17.5T540-520q0 25-17.5 42.5T480-460Z" />
        </svg>
    )
}

function PersonIcon() {
    return (
        <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
            <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" />
        </svg>
    )
}

function ProfileHeader() {
    return (
        <>
            <div className={styles.brand}>
                <span className={styles.brandMark}>
                    <PsychologyIcon />
                </span>
                <span className={styles.wordmark}>LLHelper</span>
            </div>
            <span className={styles.profileMark}>
                <PersonIcon />
            </span>
        </>
    )
}

export function CompleteProfilePage({ onSuccess }: CompleteProfilePageProps) {
    return (
        <PublicFormLayout variant="onboarding" header={<ProfileHeader />}>
            <div className={styles.screen}>
                <header className={styles.heading}>
                    <h1 id="complete-profile-title">Complete Your Profile</h1>
                    <p>
                        Tell us a bit about yourself to initialize your learning
                        environment.
                    </p>
                </header>

                <section
                    className={styles.formPanel}
                    aria-labelledby="complete-profile-title"
                >
                    <CompleteProfileForm onSuccess={onSuccess} />
                </section>
            </div>
        </PublicFormLayout>
    )
}
