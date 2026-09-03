import { Link } from 'react-router-dom'
import type { RegisterFormProps } from '@/features/register'
import { RegisterForm } from '@/features/register'
import { PublicFormLayout } from '@/widgets/public-form-layout'
import styles from './register-page.module.css'

export type RegisterPageProps = Pick<RegisterFormProps, 'onSuccess'>

export function RegisterPage({ onSuccess }: RegisterPageProps) {
    return (
        <PublicFormLayout variant="auth">
            <section className={styles.card} aria-labelledby="register-title">
                <div className={styles.accent} aria-hidden="true" />
                <div className={styles.cardBody}>
                    <header className={styles.heading}>
                        <h1 id="register-title">Create Account</h1>
                        <p>Enter your details to create a new account.</p>
                    </header>

                    <RegisterForm onSuccess={onSuccess} />

                    <footer className={styles.cardFooter}>
                        <p>
                            Already have an account?{' '}
                            <Link className={styles.link} to="/login">
                                Sign In
                            </Link>
                        </p>
                    </footer>
                </div>
            </section>
        </PublicFormLayout>
    )
}
