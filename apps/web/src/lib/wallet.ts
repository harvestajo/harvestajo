"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
  getNetwork,
} from "@stellar/freighter-api";
import type { Signer } from "@harvestajo/sdk";
import { NETWORK } from "./config";

type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WalletState {
  address: string | null;
  status: WalletStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signer: Signer | null;
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  // Check if already connected on mount.
  useEffect(() => {
    (async () => {
      try {
        const connected = await isConnected();
        if (connected) {
          const result = await getAddress();
          if (result.address) {
            setAddress(result.address);
            setStatus("connected");
          }
        }
      } catch {
        // Freighter not installed — user can connect later.
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const allowed = await setAllowed();
      if (!allowed.isAllowed) {
        setStatus("error");
        setError("Connection rejected. Please approve HarvestAjo in Freighter.");
        return;
      }

      const result = await getAddress();
      if (!result.address) {
        setStatus("error");
        setError("No Freighter account found. Create or unlock a wallet.");
        return;
      }

      const net = await getNetwork();
      if (net.networkPassphrase !== NETWORK.networkPassphrase) {
        const expected = NETWORK.networkPassphrase.includes("Test")
          ? "Testnet"
          : "Mainnet";
        setStatus("error");
        setError(
          `Freighter is on the wrong network. Switch to ${expected} in Freighter settings.`,
        );
        return;
      }

      setAddress(result.address);
      setStatus("connected");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Failed to connect to Freighter.",
      );
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setStatus("disconnected");
    setError(null);
  }, []);

  const signer = useMemo<Signer | null>(
    () =>
      address
        ? {
            publicKey: address,
            signTransaction: async (txXdr: string): Promise<string> => {
              const result = await signTransaction(txXdr, {
                networkPassphrase: NETWORK.networkPassphrase,
              });
              if ("error" in result && result.error) {
                throw new Error(result.error);
              }
              return (result as { signedTxXdr: string }).signedTxXdr;
            },
          }
        : null,
    [address],
  );

  return { address, status, error, connect, disconnect, signer };
}
