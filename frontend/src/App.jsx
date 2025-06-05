import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BrowserProvider, Contract, getAddress, formatEther } from "ethers";
import config from "./config.json";
import DAO_ABI from "./abis/DAO.json";
import TOKEN_ABI from "./abis/Token.json";
import Proposals from "./components/Proposals";
import Navigation from "./components/Navigation";
import SaveIdea from "./components/SaveIdea";
import FundDAOForm from "./components/fundDAOForm";

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [dao, setDao] = useState(null);
  const [token, setToken] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      setProvider(provider);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const checksummed = getAddress(accounts[0]);
      setAccount(checksummed);

      const signer = await provider.getSigner();

      const daoContract = new Contract(config[31337].DAO.address, DAO_ABI, signer);
      const tokenContract = new Contract(config[31337].Token.address, TOKEN_ABI, provider);

      setDao(daoContract);
      setToken(tokenContract);

      const treasuryBalanceRaw = await tokenContract.balanceOf(daoContract.target ?? daoContract.address);
      setTreasuryBalance(formatEther(treasuryBalanceRaw));

      const proposalCount = await daoContract.proposalCount();
      const proposalsArr = [];
      for (let i = 1; i <= proposalCount; i++) {
        const proposal = await daoContract.proposals(i);
        proposalsArr.push({
          id: proposal.id?.toString() ?? i.toString(),
          name: proposal.name || "Unnamed",
          amount: formatEther(proposal.amount ?? 0),
          recipient: proposal.recipient,
          votes: proposal.votes?.toString() || "0",
          finalized: !!proposal.finalized,
        });
      }
      setProposals(proposalsArr);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading blockchain data:", err);
      alert("Failed to load blockchain data. See console for details.");
      setIsLoading(false);
    }
  };

  const refreshProposals = async () => {
    if (!dao) return;
    try {
      const proposalCount = await dao.proposalCount();
      const proposalsArr = [];
      for (let i = 1; i <= proposalCount; i++) {
        const proposal = await dao.proposals(i);
        proposalsArr.push({
          id: proposal.id.toString(),
          name: proposal.name || "Unnamed",
          amount: formatEther(proposal.amount),
          recipient: proposal.recipient,
          votes: proposal.votes.toString(),
          finalized: proposal.finalized,
        });
      }
      setProposals(proposalsArr);
    } catch (err) {
      console.error("Failed to refresh proposals:", err);
    }
  };

  return (
    <Router>
      <Navigation account={account} />
      {isLoading ? (
        <p>Loading blockchain data...</p>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <>
                <h3>DAO Treasury Balance: {treasuryBalance} Tokens</h3>
                <Proposals
                  proposals={proposals}
                  contract={dao}
                  provider={provider}
                  setIsLoading={setIsLoading}
                  onProposalsUpdated={refreshProposals}
                />
              </>
            }
          />
          <Route
            path="/save-idea"
            element={
              <>
                <SaveIdea />
                <div style={{ marginTop: "1rem", fontWeight: "bold" }}>
                  DAO Treasury Balance: {treasuryBalance} Tokens
                </div>
              </>
            }
          />
          <Route path="/fund-dao" element={<FundDAOForm provider={provider} dao={dao} token={token} />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;