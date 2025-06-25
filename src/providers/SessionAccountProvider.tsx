"use client";

import {
  createContext,
  useCallback,
  useState,
  useContext,
  useEffect,
} from "react";
import { privateKeyToAccount } from "viem/accounts";
import { usePermissions } from "./PermissionProvider";
import { erc7710WalletActions } from "@metamask/delegation-toolkit/experimental";
import { createWalletClient, http, WalletClient } from "viem";
import { sepolia } from "viem/chains";

interface SessionAccountContextType {
  sessionAccount: WalletClient | null;
  createSessionAccount: (pk: `0x${string}`) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearSessionAccount: () => void;
}

export const SessionAccountContext = createContext<SessionAccountContextType>({
  sessionAccount: null,
  createSessionAccount: async (pk: `0x${string}`) => {},
  isLoading: false,
  error: null,
  clearSessionAccount: () => {},
});


export const SessionAccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sessionAccount, setSessionAccount] =
    useState<WalletClient | null>(null);
  const { removePermission } = usePermissions();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createSessionAccount = useCallback(
    async (privateKey: `0x${string}`) => {
      try {
        setIsLoading(true);
        setError(null);

        const sessionAccount = createWalletClient({
          account: privateKeyToAccount(privateKey),
          chain: sepolia,
          transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
        }).extend(erc7710WalletActions());

        setSessionAccount(sessionAccount);
      } catch (err) {
        console.error("Error creating Session account:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create account"
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearSessionAccount = useCallback(() => {
    removePermission();
    setSessionAccount(null);
  }, [removePermission]);

  // Initialize wallet from session storage on component mount if it exists
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        setIsLoading(true);

        await createSessionAccount(
          process.env.NEXT_PUBLIC_PRIVATE_KEY as `0x${string}`
        );
      } catch (err) {
        console.error("Error initializing wallet:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize wallet"
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeWallet();
  }, [createSessionAccount]);

  return (
    <SessionAccountContext.Provider
      value={{
        sessionAccount,
        createSessionAccount,
        isLoading,
        error,
        clearSessionAccount,
      }}
    >
      {children}
    </SessionAccountContext.Provider>
  );
};

export const useSessionAccount = () => {
  return useContext(SessionAccountContext);
};
