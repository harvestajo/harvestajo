"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/lib/wallet";
import { cn, truncateAddress } from "@/lib/utils";

export function WalletButton() {
  const { address, status, error, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "error" && error) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={connect}
          className="px-4 py-2 text-sm font-medium text-white bg-field-600 rounded-lg hover:bg-field-700 transition-colors"
        >
          Connect Wallet
        </button>
        <span className="text-xs text-red-600 max-w-[200px] text-right" title={error}>
          {error}
        </span>
      </div>
    );
  }

  if (status === "connected" && address) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-field-50 border border-field-200 text-field-700 hover:bg-field-100 transition-colors"
          aria-label="Wallet menu"
        >
          <span className="w-2 h-2 rounded-full bg-field-500 animate-pulse-soft" />
          <span className="font-mono text-sm hidden sm:inline">
            {truncateAddress(address)}
          </span>
          <svg
            className={cn("w-3 h-3 transition-transform", menuOpen && "rotate-180")}
            viewBox="0 0 12 12"
            fill="none"
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-harvest-200 py-1 animate-fade-in z-50">
            <div className="px-3 py-2 border-b border-harvest-100">
              <p className="text-xs text-soil-400">Connected wallet</p>
              <p className="text-sm font-mono text-soil-700 truncate">
                {truncateAddress(address, 6, 6)}
              </p>
            </div>
            <button
              onClick={() => {
                disconnect();
                setMenuOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-soil-600 hover:bg-harvest-50 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={status === "connecting"}
      className="px-4 py-2 text-sm font-medium text-white bg-field-600 rounded-lg hover:bg-field-700 transition-colors disabled:opacity-60 flex items-center gap-2"
    >
      {status === "connecting" && (
        <svg className="animate-spin-slow h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {status === "connecting" ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
