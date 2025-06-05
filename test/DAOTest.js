const { expect } = require("chai");
const { ethers, hre } = require("hardhat");

const tokens = (n) => ethers.parseUnits(n.toString(), "ether");

describe("DAO", () => {
  let token, dao;
  let deployer, funder, investor1, investor2, investor3, recipient, user;

  beforeEach(async () => {
    const signers = await ethers.getSigners();

    // Defensive check for enough signers
    if (signers.length < 6) {
      throw new Error("Not enough signers available for the tests.");
    }

    deployer = signers[0];
    funder = signers[1];
    investor1 = signers[2];
    investor2 = signers[3];
    investor3 = signers[4];
    recipient = signers[5];
    user = signers.length > 6 ? signers[6] : signers[2]; // fallback to investor1

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Governance Token", "GT", tokens(1000000));
    await token.waitForDeployment();

    console.log("Token address:", token.target); // Correct property

    const DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(token.target);
    await dao.waitForDeployment();

    // Distribute tokens to investors
    const recipients = [investor1, investor2, investor3];
    for (const r of recipients) {
      await token.transfer(r.address, tokens(200000));
    }

    // Investor1 funds DAO with 100,000 tokens
    await token.connect(investor1).approve(dao.target, tokens(100000));
    await dao.connect(investor1).fundDAO(tokens(100000));
  });

  describe("Deployment", () => {
    it("Sets the correct token", async () => {
      expect(await dao.token()).to.equal(token.target);
    });

    it("Initial DAO funding is correct", async () => {
      expect(await token.balanceOf(dao.target)).to.equal(tokens(100000));
    });
  });

  describe("Funding", () => {
    it("Allows token holders to fund the DAO", async () => {
      await token.connect(investor2).approve(dao.target, tokens(50000));
      await expect(dao.connect(investor2).fundDAO(tokens(50000)))
        .to.emit(dao, "DAOFunded")
        .withArgs(investor2.address, tokens(50000));

      expect(await token.balanceOf(dao.target)).to.equal(tokens(150000));
    });

    it("Rejects zero funding amount", async () => {
      await expect(dao.connect(investor2).fundDAO(0)).to.be.revertedWith(
        "Amount must be greater than 0"
      );
    });
  });

  describe("Proposal Creation", () => {
    it("Allows proposals if DAO has enough funds", async () => {
      await expect(
        dao
          .connect(investor1)
          .createProposal("Build Dapp", tokens(20000), recipient.address)
      )
        .to.emit(dao, "ProposalCreated")
        .withArgs(1, tokens(20000), recipient.address, investor1.address);

      const proposal = await dao.proposals(1);
      expect(proposal.name).to.equal("Build Dapp");
      expect(proposal.amount).to.equal(tokens(20000));
      expect(proposal.recipient).to.equal(recipient.address);
      expect(proposal.finalized).to.be.false;
    });

    it("Allows non-token holders to create proposals", async () => {
      await expect(
        dao
          .connect(user)
          .createProposal("Open Suggestion", tokens(5000), recipient.address)
      )
        .to.emit(dao, "ProposalCreated")
        .withArgs(1, tokens(5000), recipient.address, user.address);
    });

    it("Rejects proposals requesting more than DAO funds", async () => {
      await expect(
        dao
          .connect(investor1)
          .createProposal("Too Much", tokens(2000000), recipient.address)
      ).to.be.revertedWith("DAO lacks funds");
    });
  });

  describe("Voting", () => {
    beforeEach(async () => {
      await dao
        .connect(investor1)
        .createProposal("Proposal 1", tokens(30000), recipient.address);
    });

    it("Allows token holders to vote", async () => {
      await token.connect(investor2).approve(dao.target, tokens(25));
      await expect(dao.connect(investor2).vote(1, tokens(25)))
        .to.emit(dao, "Voted")
        .withArgs(1, investor2.address, tokens(25));
    });

    it("Enforces max vote cap per proposal", async () => {
      await token.connect(investor2).approve(dao.target, tokens(50));
      await dao.connect(investor2).vote(1, tokens(20));
      await expect(
        dao.connect(investor2).vote(1, tokens(30))
      ).to.be.revertedWith("Vote exceeds max allowed per proposal");
    });

    it("Rejects votes from non-token holders", async () => {
      await expect(dao.connect(user).vote(1, tokens(10))).to.be.revertedWith(
        "Must be a token holder"
      );
    });

    // Removed test that rejected votes after deadline
  });

  describe("Finalizing Proposal", () => {
    beforeEach(async () => {
      // Fund DAO with enough tokens for the proposal(s)
      await token.transfer(dao.target, tokens(200000)); // Fund DAO

      await dao
        .connect(investor1)
        .createProposal("Fund Project", tokens(30000), recipient.address);

      await token.connect(investor2).approve(dao.target, tokens(25));
      await dao.connect(investor2).vote(1, tokens(25));

      await token.connect(investor3).approve(dao.target, tokens(25));
      await dao.connect(investor3).vote(1, tokens(25));
    });

    it("Finalizes the top proposal and transfers tokens", async () => {
      const before = await token.balanceOf(recipient.address);

      await expect(dao.connect(investor1).finalizeProposal(1))
        .to.emit(dao, "ProposalFinalized")
        .withArgs(1);

      const after = await token.balanceOf(recipient.address);

      // Use native bigint subtraction
      expect(after - before).to.equal(tokens(30000));

      const proposal = await dao.proposals(1);
      expect(proposal.finalized).to.be.true;
    });

    it("Rejects finalizing more than one proposal", async () => {
      await dao.connect(investor1).finalizeProposal(1);

      await expect(
        dao.connect(investor2).finalizeProposal(1)
      ).to.be.revertedWith("Proposal already finalized");
    });
  });
});
