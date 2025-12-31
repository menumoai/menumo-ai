import type { Product } from "../../models/product";

export function ProductList(props: {
    products: Product[];
    loading: boolean;
}) {
    const { products, loading } = props;

    return (
        <section>
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Products ({products.length})
                </h2>
            </div>

            {loading && products.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            ) : products.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    No products yet. Add your first item above.
                </p>
            ) : (
                <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                    {products.map((p) => (
                        <li key={p.id} className="flex items-start justify-between gap-4 px-4 py-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <strong className="text-sm font-medium text-slate-900 dark:text-slate-50">
                                        {p.name}
                                    </strong>
                                    {p.category && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                            {p.category}
                                        </span>
                                    )}
                                </div>
                                {p.description && (
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {p.description}
                                    </p>
                                )}
                            </div>

                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                ${p.price.toFixed(2)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
