// src/components/menu/productFormValidation.ts
//
// One set of rules for the product form, used by both the form (to mark fields
// and show inline errors) and MenuPage's save handler (to refuse a bad write).
// Keeping them in one place stops the button and the handler drifting apart.

import type { AddProductFormValues } from "./AddProductForm";

export type ProductFieldErrors = Partial<
    Record<keyof AddProductFormValues, string>
>;

/** Fields the form cannot be submitted without. */
export const REQUIRED_PRODUCT_FIELDS: ReadonlyArray<keyof AddProductFormValues> =
    ["name", "price"];

export function validateProductForm(
    values: AddProductFormValues,
): ProductFieldErrors {
    const errors: ProductFieldErrors = {};

    if (!values.name.trim()) {
        errors.name = "Give the item a name.";
    }

    const rawPrice = values.price.trim();
    if (!rawPrice) {
        errors.price = "Enter what you charge for it.";
    } else {
        const price = Number.parseFloat(rawPrice);
        if (Number.isNaN(price)) {
            errors.price = "Price must be a number, like 5.50.";
        } else if (price < 0) {
            errors.price = "Price cannot be negative.";
        }
    }

    // Cost is optional, but if it is filled in it has to make sense.
    const rawCost = values.cost.trim();
    if (rawCost) {
        const cost = Number.parseFloat(rawCost);
        if (Number.isNaN(cost)) {
            errors.cost = "Cost must be a number, like 2.10.";
        } else if (cost < 0) {
            errors.cost = "Cost cannot be negative.";
        }
    }

    return errors;
}

export function isProductFormValid(values: AddProductFormValues): boolean {
    return Object.keys(validateProductForm(values)).length === 0;
}
