const hre = require("hardhat");

async function main() {
  const NAME = "MotionToken";
  const SYMBOL = "MOTN";
  const MAX_SUPPLY = "1000000";

  // Deploy Token
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY);

  // Wait for deployment to be mined
  await token.waitForDeployment();

  console.log(`Token deployed to: ${token.target}\n`); // token.target is the deployed address

  // Deploy DAO with token address
  const DAO = await hre.ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(token.target);

  await dao.waitForDeployment();

  console.log(`DAO deployed to: ${dao.target}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});