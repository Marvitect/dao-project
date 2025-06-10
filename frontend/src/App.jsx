import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BrowserProvider, Contract, getAddress, formatEther } from "ethers";
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { mainnet, arbitrum } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import config from "./config.json";
import DAO_ABI from "./abis/DAO.json";
import TOKEN_ABI from "./abis/Token.json";
import Proposals from "./components/Proposals";
import Navigation from "./components/Navigation";
import SaveIdea from "./components/SaveIdea";
import FundDAOForm from "./components/fundDAOForm";

// Initialize QueryClient for React Query
const queryClient = new QueryClient();

// Get projectId from Reown Cloud Dashboard
// To get your project ID:
// 1. Go to https://cloud.reown.com
// 2. Create a new project
// 3. Copy the project ID and replace this value
const projectId = 'test-project-id'; // Replace with your actual project ID from Reown Cloud

// Create metadata object for Reown AppKit
const metadata = {
  name: 'DAO Project',
  description: 'DAO and Fund Distribution Project',
  url: window.location.origin,
  icons: ['https://your-icon-url.com/icon.png'] // Replace with your icon URL
};

// Set supported networks
const networks = [mainnet, arbitrum];

// Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
});

// Initialize Reown AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true
  }
});

// Create a context provider component
function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

function App() {
  const [provider, setProvider] = useState(null);
  const [dao, setDao] = useState(null);
  const [token, setToken] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(true);

  // Use Reown AppKit hooks
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { open } = useAppKit();

  useEffect(() => {
    if (isConnected && walletProvider) {
      loadBlockchainData();
    }
  }, [isConnected, walletProvider]);

  const loadBlockchainData = async () => {
    try {
      const provider = new BrowserProvider(walletProvider);
      setProvider(provider);

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
    <AppKitProvider>
      <Router>
        <Navigation account={address} onConnect={() => open()} />
        {!isConnected ? (
          <div className="flex justify-center items-center h-screen">
            <button 
              onClick={() => open()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          </div>
        ) : isLoading ? (
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
    </AppKitProvider>
  );
}

export default App;