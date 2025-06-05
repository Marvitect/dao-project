import { useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { ethers } from "ethers";
import Create from "./Create"; // Adjust path if needed
import ProposalCards from "./ProposalCards";

const Proposals = ({
  proposals,
  quorum,
  contract,       // DAO contract with signer for write txs
  provider,       // provider, passed to Create component
  setIsLoading,
  onProposalsUpdated, // optional callback to refresh proposals after tx
  tokenAddress,    // ERC20 token address, needed for approval
  tokenAbi         // ERC20 ABI (minimal ERC20 approve, allowance)
}) => {
  const [voteAmounts, setVoteAmounts] = useState({});
  const [txLoadingIds, setTxLoadingIds] = useState({}); // track per-proposal tx loading

  // Update vote amount input for a proposal
  const handleVoteChange = (proposalId, value) => {
    if (value === "" || (/^\d*\.?\d*$/.test(value) && Number(value) >= 0)) {
      setVoteAmounts((prev) => ({ ...prev, [proposalId]: value }));
    }
  };

  // Shorten Ethereum address for display
  const shortenAddress = (addr) =>
    addr && addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr || "";

  // Check if proposal ID exists in proposals list
  const isValidProposalId = (id) => {
    return proposals.some((p) => p.id === id);
  };

  // Handle voting on a proposal
  const voteHandler = async (proposalId) => {
    console.log("DAO contract instance in voteHandler:", contract);
    if (!contract) {
      alert("DAO contract not connected.");
      return;
    }
    if (!isValidProposalId(proposalId)) {
      alert("Invalid proposal ID.");
      return;
    }

    const amountStr = voteAmounts[proposalId];
    if (!amountStr || Number(amountStr) <= 0) {
      alert("Enter a valid vote amount.");
      return;
    }

    try {
      setTxLoadingIds((prev) => ({ ...prev, [proposalId]: true }));
      setIsLoading?.(true);

      const amount = ethers.parseUnits(amountStr.toString(), 18);

      // Get signer and address
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      // Connect contract with signer for write calls
      const contractWithSigner = contract.connect(signer);

      // Token contract instance for allowance/approval
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

      // Check allowance
      const allowance = await tokenContract.allowance(signerAddress, contract.address);
      if (allowance.lt(amount)) {
        // Approve DAO contract to spend tokens
        const approveTx = await tokenContract.approve(contract.address, amount);
        await approveTx.wait();
      }

      // Call vote on DAO contract
      const tx = await contractWithSigner.vote(proposalId, amount);
      await tx.wait();

      alert("Vote successful!");

      // Clear vote input for the proposal
      setVoteAmounts((prev) => ({ ...prev, [proposalId]: "" }));

      // Refresh proposals data if callback provided
      onProposalsUpdated?.();
    } catch (err) {
      console.error("Voting error:", err);
      alert("Failed to vote. See console for details.");
    } finally {
      setTxLoadingIds((prev) => ({ ...prev, [proposalId]: false }));
      setIsLoading?.(false);
    }
  };

  // Handle finalizing a proposal
  const finalizeHandler = async (proposalId) => {
    console.log("DAO contract instance in finalizeHandler:", contract);
    if (!contract) {
      alert("DAO contract not connected.");
      return;
    }
    if (!isValidProposalId(proposalId)) {
      alert("Invalid proposal ID.");
      return;
    }

    try {
      setTxLoadingIds((prev) => ({ ...prev, [proposalId]: true }));
      setIsLoading?.(true);

      // Get signer and connect contract
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.finalizeProposal(proposalId);
      await tx.wait();

      alert("Proposal finalized!");

      onProposalsUpdated?.();
    } catch (err) {
      console.error("Finalize error:", err);
      alert("Failed to finalize proposal. See console for details.");
    } finally {
      setTxLoadingIds((prev) => ({ ...prev, [proposalId]: false }));
      setIsLoading?.(false);
    }
  };

  // Convert quorum to BigInt for comparison
  const quorumBigInt = BigInt(quorum ?? "0");

  return (
    <>
      <Create provider={provider} dao={contract} setIsLoading={setIsLoading} />

      <div className="proposals-table-wrapper" style={{ marginTop: "1rem" }}>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Proposal Title</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Total Votes</th>
              <th>Cast Vote</th>
              <th>Finalize</th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No proposals found.
                </td>
              </tr>
            )}

            {proposals.map((proposal, index) => {
              const id = proposal.id ?? index;
              const isFinalized = proposal.finalized === true;
              const votesBigInt = BigInt(proposal.votes ?? "0");
              const amountFormatted = proposal.amount ?? "0";
              const loading = !!txLoadingIds[id];

              return (
                <tr key={id}>
                  <td>{id.toString()}</td>
                  <td>
                    {proposal.link ? (
                      <a href={proposal.link} target="_blank" rel="noopener noreferrer" style={{ wordBreak: "break-all" }}>
                        {proposal.link}
                      </a>
                    ) : (
                      proposal.name || "No Title"
                    )}
                  </td>
                  <td>{shortenAddress(proposal.recipient)}</td>
                  <td>{amountFormatted} TOKENS</td>
                  <td>{isFinalized ? "Approved" : "In Progress"}</td>
                  <td>{votesBigInt.toString()}</td>
                  <td>
                    {!isFinalized && (
                      <>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Tokens to vote"
                          value={voteAmounts[id] || ""}
                          onChange={(e) => handleVoteChange(id, e.target.value)}
                          style={{ width: "70%", marginRight: "5px" }}
                          disabled={loading}
                        />
                        <Button
                          variant="primary"
                          disabled={!contract || loading || !voteAmounts[id] || Number(voteAmounts[id]) <= 0}
                          onClick={() => voteHandler(id)}
                        >
                          {loading ? "Voting..." : "Vote"}
                        </Button>
                      </>
                    )}
                  </td>
                  <td>
                    {!isFinalized && votesBigInt > quorumBigInt && (
                      <Button
                        variant="success"
                        style={{ width: "100%" }}
                        onClick={() => finalizeHandler(id)}
                        disabled={!contract || loading}
                      >
                        {loading ? "Finalizing..." : "Finalize"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>

        <ProposalCards proposals={proposals} />
      </div>
    </>
  );
};

export default Proposals;