// src/components/inventory/ScanReceiptButton.tsx
import { useRef } from "react";
import { ScanLine } from "lucide-react";

interface ScanReceiptButtonProps {
    /** Called with the chosen image; the parent runs OCR extraction. */
    onSelect: (file: File) => void;
    /** True while the parent is extracting, to show a busy state. */
    loading?: boolean;
    disabled?: boolean;
}

/**
 * Opens the device photo picker / camera and hands the chosen receipt image to
 * the parent for OCR extraction. `capture="environment"` prompts the rear camera
 * on mobile so an owner can photograph a paper receipt in place.
 */
export function ScanReceiptButton({
    onSelect,
    loading,
    disabled,
}: ScanReceiptButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        // Reset so picking the same file again still fires onChange.
        e.target.value = "";
        if (file) onSelect(file);
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleChange}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || loading}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <ScanLine className="mr-2 h-4 w-4" />
                {loading ? "Reading receipt…" : "Scan receipt"}
            </button>
        </>
    );
}
