"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WalletButton } from "./WalletButton";

const navLinks = [
  { href: "/", label: "Fields" },
  { href: "/create", label: "Plant a Field" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-harvest-200 bg-harvest-50/85 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl transition-transform group-hover:scale-110">
            {"\u{1F33E}"}
          </span>
          <span className="font-bold text-lg">
            <span className="text-field-700">Harvest</span>
            <span className="text-harvest-600">Ajo</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-field-100 text-field-700"
                    : "text-soil-600 hover:bg-harvest-100 hover:text-soil-800",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="w-px h-6 bg-harvest-200 mx-1 sm:mx-2" />
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
