import type { SelectedOptionsMap } from "./orderTypes";

export function toggleOption(
    prev: SelectedOptionsMap,
    productId: string,
    groupId: string,
    optionId: string,
    multiSelect: boolean
): SelectedOptionsMap {
    const productOpts = prev[productId] ?? {};
    const groupOpts = productOpts[groupId] ?? [];

    const nextGroupOpts = multiSelect
        ? groupOpts.includes(optionId)
            ? groupOpts.filter((id) => id !== optionId)
            : [...groupOpts, optionId]
        : [optionId];

    return {
        ...prev,
        [productId]: {
            ...productOpts,
            [groupId]: nextGroupOpts,
        },
    };
}
