// src/components/auth/GoogleSignInButton.tsx
interface GoogleSignInButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

export function GoogleSignInButton({
    onClick,
    disabled,
}: GoogleSignInButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
        >
            Continue with Google
        </button>
    );
}
