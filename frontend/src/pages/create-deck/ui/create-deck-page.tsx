import { Link, useNavigate } from 'react-router-dom'
import { CreateDeckForm } from '@/features/create-deck'
import styles from './create-deck-page.module.css'

function DeckIcon() {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M5 3h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V3Zm3 4v2h8V7H8Zm0 4v2h6v-2H8Z" />
        </svg>
    )
}

export function CreateDeckPage() {
    const navigate = useNavigate()

    return (
        <div className={styles.page}>
            <Link className={styles.backLink} to="/learning">
                <span aria-hidden="true">←</span>
                Back to Learning
            </Link>

            <section
                className={styles.panel}
                aria-labelledby="create-deck-title"
            >
                <header className={styles.panelHeader}>
                    <span className={styles.icon}>
                        <DeckIcon />
                    </span>
                    <div>
                        <h1 id="create-deck-title">Create Deck</h1>
                        <p>Create a new vocabulary deck.</p>
                    </div>
                </header>

                <div className={styles.panelBody}>
                    <CreateDeckForm
                        onSuccess={(deck) =>
                            navigate(`/decks/${deck.id}/manage`)
                        }
                        onCancel={() => navigate('/learning')}
                    />
                </div>
            </section>
        </div>
    )
}
