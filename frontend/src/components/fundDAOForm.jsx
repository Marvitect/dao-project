import { useState } from "react";
import { ethers } from "ethers";
export default function FundDAOForm({ provider, dao, token }) {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [isFunding, setIsFunding] = useState(false);

  if (!provider || !dao || !token) {
    return <p>Loading contracts...</p>;
  }

  const fundDAO = async () => {
    if (!window.ethereum) {
      setStatus("Please install MetaMask.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setStatus("Enter a valid amount.");
      return;
    }

    try {
      setStatus("");
      setIsFunding(true);

      // Get signer from provider
      const signer = await provider.getSigner();

      // Connect contracts with signer for write access
      const tokenWithSigner = token.connect(signer);
      const daoWithSigner = dao.connect(signer);

      // Parse amount to token decimals (assuming 18 decimals)
      const amountParsed = ethers.parseUnits(amount, 18);

      setStatus("Approving tokens...");
      const approveTx = await tokenWithSigner.approve(dao.target, amountParsed);
      await approveTx.wait();

      setStatus("Funding DAO...");
      const fundTx = await daoWithSigner.fundDAO(amountParsed);
      await fundTx.wait();

      setStatus("Successfully funded the DAO!");
      setAmount("");
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err.data?.message || err.message || "Transaction failed"));
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto border rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Fund the DAO</h2>
      <input
        type="number"
        min="0"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to fund"
        className="border p-2 w-full mb-4"
        disabled={isFunding}
      />
      <button
        onClick={fundDAO}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        disabled={isFunding}
      >
        {isFunding ? "Processing..." : "Fund DAO"}
      </button>
      {status && <p className="mt-2 text-center text-sm">{status}</p>}
    </div>
  );
}
