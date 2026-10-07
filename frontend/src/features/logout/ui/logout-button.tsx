import { useDispatch } from 'react-redux'
import { logout } from '../model/logout'

export interface LogoutButtonProps {
    className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
    const dispatch = useDispatch()

    return (
        <button
            className={className}
            type="button"
            onClick={() => logout(dispatch)}
        >
            Log out
        </button>
    )
}
