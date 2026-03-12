// src/pages/LandingPage.tsx
import { Link } from "react-router-dom";
import {
    Truck,
    ChefHat,
    Clock,
    DollarSign,
    Sparkles,
    CircleCheck,
    ArrowRight,
} from "lucide-react";

export function LandingPage() {
    return (
        <div className="min-h-screen bg-[#FBF8F3]">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700">
                            <Truck className="h-5 w-5 text-white" />
                        </div>
                        <span
                            className="text-xl font-bold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Menumo
                        </span>
                    </div>

                    <div className="hidden items-center gap-8 md:flex">
                        <a href="#features" className="text-sm text-gray-700 hover:text-gray-900">
                            Features
                        </a>
                        <a href="#how-it-works" className="text-sm text-gray-700 hover:text-gray-900">
                            How it works
                        </a>
                        <a href="#small-teams" className="text-sm text-gray-700 hover:text-gray-900">
                            Why Menumo
                        </a>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/auth"
                            className="hidden rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:inline-flex"
                        >
                            Log in
                        </Link>

                        <Link
                            to="/auth"
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
                        >
                            Get started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="py-12 lg:py-20">
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
                    <div className="space-y-6 lg:space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
                            <Sparkles className="h-4 w-4" />
                            Built for food trucks
                        </div>

                        <h1
                            className="text-4xl leading-tight text-gray-900 sm:text-5xl lg:text-6xl"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Smarter decisions for food trucks on the move
                        </h1>

                        <p className="max-w-xl text-lg text-gray-600 sm:text-xl">
                            AI-powered insights that help you prep the right amount, price better,
                            and waste less — without the enterprise price tag.
                        </p>

                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Link
                                to="/auth"
                                className="inline-flex items-center justify-center rounded-full border-2 border-gray-300 px-8 py-3 text-lg text-gray-700 transition hover:bg-gray-50"
                            >
                                See how it works
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>

                            <Link
                                to="/auth"
                                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#D94C3D] to-[#E67E50] px-8 py-3 text-lg text-white shadow-lg transition hover:opacity-95"
                            >
                                Start free trial
                                <Sparkles className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Placeholder visual */}
                    <div className="lg:pl-8">
                        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Today’s forecast</div>
                                    <div className="text-2xl font-bold text-gray-900">$1,240 projected</div>
                                </div>
                                <div className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700">
                                    +15%
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="rounded-2xl bg-gray-50 p-4">
                                    <div className="text-sm text-gray-500">Prep recommendation</div>
                                    <div className="mt-1 font-semibold text-gray-900">
                                        Prep 20% more tacos for lunch rush
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-gray-50 p-4">
                                    <div className="text-sm text-gray-500">Waste forecast</div>
                                    <div className="mt-1 font-semibold text-gray-900">
                                        Keep waste below 6% today
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-gray-50 p-4">
                                    <div className="text-sm text-gray-500">Peak window</div>
                                    <div className="mt-1 font-semibold text-gray-900">
                                        12:30 PM – 1:45 PM
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problems */}
            <section id="features" className="bg-white py-16 lg:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center lg:mb-16">
                        <h2
                            className="mb-4 text-3xl text-gray-900 sm:text-4xl lg:text-5xl"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Real Problems, Simple Fixes
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600">
                            Running a food truck means juggling a million things. Menumo helps you
                            focus on the right ones.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
                        <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100 p-8 shadow-lg">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
                                <ChefHat className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold text-gray-900">
                                Not sure what to prep?
                            </h3>
                            <p className="text-gray-700">
                                Menumo uses sales history and trends to help you prepare the right amount.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-teal-100 p-8 shadow-lg">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600">
                                <Clock className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold text-gray-900">
                                Lines too long?
                            </h3>
                            <p className="text-gray-700">
                                Get visibility into rush patterns so you can prep ahead and move faster.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-gradient-to-br from-red-50 to-red-100 p-8 shadow-lg">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500">
                                <DollarSign className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold text-gray-900">
                                Margins too tight?
                            </h3>
                            <p className="text-gray-700">
                                Track products, orders, and expenses in one place so profitability is clearer.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="bg-gradient-to-b from-teal-50 to-teal-100 py-16 lg:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center lg:mb-16">
                        <h2
                            className="mb-4 text-3xl text-gray-900 sm:text-4xl lg:text-5xl"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            How It Works
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-700">
                            Start simple, then grow into smarter operations.
                        </p>
                    </div>

                    <div className="mx-auto max-w-4xl space-y-8">
                        {[
                            ["1", "Track your menu and orders", "Start by managing products, orders, and locations in one place."],
                            ["2", "Learn your patterns", "Menumo helps surface trends from your business data."],
                            ["3", "Act with confidence", "Use the dashboard to make better prep, pricing, and operations decisions."],
                        ].map(([num, title, desc]) => (
                            <div key={num} className="rounded-3xl bg-white p-8 shadow-xl lg:p-10">
                                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-2xl font-bold text-white">
                                        {num}
                                    </div>
                                    <div>
                                        <h3 className="mb-3 text-2xl font-semibold text-gray-900">{title}</h3>
                                        <p className="text-lg text-gray-600">{desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Small teams */}
            <section id="small-teams" className="bg-white py-16 lg:py-24">
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
                    <div className="space-y-6">
                        <h2
                            className="text-3xl text-gray-900 sm:text-4xl lg:text-5xl"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Designed for Small Teams
                        </h2>

                        <p className="text-lg text-gray-600">
                            No IT department. No complicated setup. Just software that helps food truck operators work smarter.
                        </p>

                        <ul className="space-y-4">
                            {[
                                "Mobile-friendly and simple to use",
                                "Fast onboarding with minimal setup",
                                "Clear language instead of enterprise jargon",
                                "Built for operators, not giant chains",
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <CircleCheck className="mt-1 h-6 w-6 flex-shrink-0 text-teal-600" />
                                    <span className="text-gray-700">{item}</span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/auth"
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#D94C3D] to-[#E67E50] px-8 py-3 text-lg text-white shadow-lg transition hover:opacity-95"
                        >
                            Get started
                        </Link>
                    </div>

                    <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-orange-50 p-10 shadow-xl">
                        <div className="space-y-4">
                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                                <div className="text-sm text-gray-500">Today's recommendation</div>
                                <div className="mt-1 font-semibold text-gray-900">
                                    Prep 15% more lunch inventory
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                                <div className="text-sm text-gray-500">Top location</div>
                                <div className="mt-1 font-semibold text-gray-900">
                                    Downtown Arts District
                                </div>
                            </div>
                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                                <div className="text-sm text-gray-500">Average order value</div>
                                <div className="mt-1 font-semibold text-gray-900">$18.40</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="bg-gradient-to-br from-teal-600 to-teal-700 py-16 lg:py-24">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h2
                        className="mb-6 text-3xl text-white sm:text-4xl lg:text-5xl"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Ready to stop guessing?
                    </h2>
                    <p className="mb-8 text-xl text-teal-100">
                        Start organizing your menu, orders, locations, and insights with Menumo.
                    </p>

                    <Link
                        to="/auth"
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#D94C3D] to-[#E67E50] px-8 py-3 text-lg text-white shadow-lg transition hover:opacity-95"
                    >
                        Start Free Trial
                        <Sparkles className="ml-2 h-5 w-5" />
                    </Link>

                    <p className="mt-6 text-sm text-teal-200">
                        No credit card • Get started in minutes
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 py-12 text-gray-400">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 grid gap-8 md:grid-cols-4">
                        <div>
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700">
                                    <Truck className="h-5 w-5 text-white" />
                                </div>
                                <span
                                    className="text-xl font-bold text-white"
                                    style={{ fontFamily: "Poppins, sans-serif" }}
                                >
                                    Menumo
                                </span>
                            </div>
                            <p className="text-sm">
                                Smarter software for food trucks and mobile food operators.
                            </p>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold text-white">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#features" className="hover:text-white">Features</a></li>
                                <li><Link to="/auth" className="hover:text-white">Get started</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold text-white">Resources</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#how-it-works" className="hover:text-white">How it works</a></li>
                                <li><a href="#small-teams" className="hover:text-white">Why Menumo</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold text-white">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/auth" className="hover:text-white">Login</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 text-center text-sm">
                        <p>&copy; 2026 Menumo. Built for the road.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
