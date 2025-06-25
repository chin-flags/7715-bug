"use client";

import { useState } from "react";
import { createPublicClient, encodeFunctionData, Hex, http } from "viem";
import { sepolia } from "viem/chains";
import { useSessionAccount } from "@/providers/SessionAccountProvider";
import { usePermissions } from "@/providers/PermissionProvider";
import { Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { config } from "@/config";
import Button from "@/components/Button";
import {
  encodeExecutionCalldatas,
  ExecutionStruct,
  DelegationManager,
  SINGLE_DEFAULT_MODE,
} from "@metamask/delegation-toolkit";

export default function RedeemPermissionButton() {
  const { sessionAccount } = useSessionAccount();
  const { permission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<Hex | null>(null);

  /**
   * Handles the redemption of delegation permissions.
   * Retrieves stored permission data, sends a user operation with delegation,
   * and updates the transaction hash state.
   * @returns {Promise<void>}
   */
  const handleRedeemPermission = async () => {
    if (!permission) return;

    if (!sessionAccount || !sessionAccount.account) return;

    setLoading(true);

    try {
      const { accountMeta, context, signerMeta } = permission;

      if (!signerMeta) {
        console.error("No signer meta found");
        setLoading(false);
        return;
      }
      const { delegationManager } = signerMeta;

      // Validate required parameters
      if (!context || !delegationManager) {
        console.error("Missing required parameters for delegation");
        setLoading(false);
        return;
      }

      const executions: ExecutionStruct[] = [
        {
          target: "0x976A37403F92c850aC635952b2ac702afd9eFF20",
          value: 1n,
          callData: "0x",
        },
      ];

      const calldata = encodeFunctionData({
        abi: DelegationManager.abi,
        functionName: "redeemDelegations",
        args: [
          [context],
          [SINGLE_DEFAULT_MODE],
          encodeExecutionCalldatas([executions]),
        ],
      });

      try {
        const hash = await sessionAccount.sendTransaction({
          account: sessionAccount.account,
          chain: sepolia,
          to: delegationManager,
          data: calldata,
        });

        console.log("Transaction hash:", hash);
        setTxHash(hash);
      } catch (txError) {
        console.error("Transaction error:", txError);
        throw txError;
      }
    } catch (error) {
      console.error("Error in handleRedeemPermission:", error);
    } finally {
      setLoading(false);
    }
  };

  if (txHash) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-600 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
            Transaction Successful!
          </h3>
          <p className="text-green-700 dark:text-green-300 mb-4">
            Your transaction has been processed and confirmed on the blockchain.
          </p>

          <Button
            className="w-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 space-x-2"
            onClick={() =>
              window.open(`${config.ethScanerUrl}/tx/${txHash}`, "_blank")
            }
          >
            <span>View on Etherscan</span>
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <Button
            className="w-full space-x-2"
            onClick={handleRedeemPermission}
            disabled={loading}
          >
            <span>
              {loading ? "Processing Transaction..." : "Redeem Permission"}
            </span>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        className="w-full space-x-2"
        onClick={handleRedeemPermission}
        disabled={loading}
      >
        <span>
          {loading ? "Processing Transaction..." : "Redeem Permission (Direct call)"}
        </span>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CheckCircle className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
