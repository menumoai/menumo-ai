// src/components/onboarding/featureIcons.ts
//
// Maps the string icon keys in src/config/features.ts onto lucide components.
// Keeping this out of the config file lets the catalog stay data-only.

import {
    AlertTriangle,
    Bell,
    BarChart3,
    Boxes,
    Calendar,
    Camera,
    ChefHat,
    Clock,
    Code2,
    CreditCard,
    DollarSign,
    Heart,
    LayoutDashboard,
    Layers,
    ListChecks,
    MapPin,
    Plug,
    Plus,
    Receipt,
    Settings,
    ShoppingCart,
    Sparkles,
    Truck,
    User,
    Users,
    UtensilsCrossed,
    LayoutGrid,
    type LucideIcon,
} from "lucide-react";

export const FEATURE_ICONS: Record<string, LucideIcon> = {
    alert: AlertTriangle,
    bell: Bell,
    boxes: Boxes,
    calendar: Calendar,
    camera: Camera,
    card: CreditCard,
    cart: ShoppingCart,
    chart: BarChart3,
    chef: ChefHat,
    clock: Clock,
    code: Code2,
    dashboard: LayoutDashboard,
    dollar: DollarSign,
    grid: LayoutGrid,
    heart: Heart,
    layers: Layers,
    list: ListChecks,
    pin: MapPin,
    plug: Plug,
    plus: Plus,
    receipt: Receipt,
    settings: Settings,
    sparkles: Sparkles,
    truck: Truck,
    user: User,
    users: Users,
    utensils: UtensilsCrossed,
};

export function featureIcon(key: string): LucideIcon {
    return FEATURE_ICONS[key] ?? Sparkles;
}
