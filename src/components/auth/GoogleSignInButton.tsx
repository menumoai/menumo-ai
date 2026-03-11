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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
            <svg
                width="18"
                height="18"
                viewBox="0 0 48 48"
                className="flex-shrink-0"
            >
                <path
                    fill="#EA4335"
                    d="M24 9.5c3.4 0 6.4 1.2 8.8 3.2l6.6-6.6C35.3 2.2 30 0 24 0 14.7 0 6.8 5.5 2.9 13.5l7.7 6C12.6 13.2 17.9 9.5 24 9.5z"
                />
                <path
                    fill="#4285F4"
                    d="M46.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.4h12.7c-.3 2.2-1.8 5.6-5.2 7.9l7.9 6.1c4.6-4.3 7.7-10.7 7.7-17.5z"
                />
                <path
                    fill="#FBBC05"
                    d="M10.6 28.3c-.6-1.7-1-3.5-1-5.3s.4-3.6 1-5.3l-7.7-6C1 15.2 0 19.5 0 23s1 7.8 2.9 11.3l7.7-6z"
                />
                <path
                    fill="#34A853"
                    d="M24 48c6.5 0 12-2.1 16-5.8l-7.9-6.1c-2.2 1.5-5.1 2.6-8.1 2.6-6.1 0-11.4-3.7-13.3-8.9l-7.7 6C6.8 42.5 14.7 48 24 48z"
                />
            </svg>

            Continue with Google
        </button>
    );
}
