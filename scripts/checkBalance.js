import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const daoAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Use Hardhat network provider as a JsonRpcProvider
  const provider = new ethers.JsonRpcProvider(hre.network.config.url);

  // Create contract instance with ethers v6 style
  const Token = new ethers.Contract(tokenAddress, (await hre.artifacts.readArtifact("Token")).abi, provider);

  const balance = await Token.balanceOf(daoAddress);
  const decimals = await Token.decimals();

  console.log("DAO token balance (raw):", balance.toString());
  console.log("DAO token balance (formatted):", ethers.formatUnits(balance, decimals));
}

main().catch(console.error);
