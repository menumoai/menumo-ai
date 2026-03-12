interface AuthStatusTextProps {
    status: string;
}

export function AuthStatusText({ status }: AuthStatusTextProps) {
    if (!status) return null;

    const isError =
        status.toLowerCase().includes("error") ||
        status.toLowerCase().includes("failed");

    return (
        <div
            className={`mt-4 rounded-xl border px-3 py-2 text-sm ${isError
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
        >
            {status}
        </div>
    );
}
