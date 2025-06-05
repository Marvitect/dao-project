// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./Token.sol";

contract DAO {
    address public owner;
    Token public token;
    uint256 public proposalCount;
    uint256 public constant MAX_VOTE_PER_PROPOSAL = 25 * 10 ** 18;

    struct Proposal {
        uint256 id;
        string name;
        uint256 amount;
        address recipient;
        uint256 votes;
        bool finalized;
        // Remove createdAt and deadline
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => uint256)) public votesByVoter;

    event ProposalCreated(uint256 id, uint256 amount, address recipient, address creator);
    event Voted(uint256 id, address voter, uint256 amount);
    event ProposalFinalized(uint256 id);
    event DAOFunded(address from, uint256 amount);

    constructor(Token _token) {
        owner = msg.sender;
        token = _token;
    }

    modifier onlyInvestor() {
        require(token.balanceOf(msg.sender) > 0, "Must be a token holder");
        _;
    }

    function fundDAO(uint256 _amount) external returns (bool) {
        require(_amount > 0, "Amount must be greater than 0");
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        emit DAOFunded(msg.sender, _amount);
        return true;
    }

    function createProposal(
        string memory _name,
        uint256 _amount,
        address _recipient
    ) external {
        require(token.balanceOf(address(this)) >= _amount, "DAO lacks funds");

        proposalCount++;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            name: _name,
            amount: _amount,
            recipient: _recipient,
            votes: 0,
            finalized: false
            // no createdAt or deadline
        });

        emit ProposalCreated(proposalCount, _amount, _recipient, msg.sender);
    }

    function vote(uint256 _id, uint256 _amount) external onlyInvestor {
        Proposal storage proposal = proposals[_id];

        require(!proposal.finalized, "Proposal already finalized");
        require(_amount > 0, "Must vote with tokens");
        require(token.balanceOf(msg.sender) >= _amount, "Insufficient token balance");

        uint256 totalVoted = votesByVoter[msg.sender][_id];
        require(
            totalVoted + _amount <= MAX_VOTE_PER_PROPOSAL,
            "Vote exceeds max allowed per proposal"
        );

        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

        proposal.votes += _amount;
        votesByVoter[msg.sender][_id] = totalVoted + _amount;

        emit Voted(_id, msg.sender, _amount);
    }

    function finalizeProposal(uint256 _id) external {
        Proposal storage proposal = proposals[_id];

        require(!proposal.finalized, "Proposal already finalized");
        require(token.balanceOf(address(this)) >= proposal.amount, "DAO lacks funds for payout");

        // No deadline check here - frontend should only call finalize if voting period expired

        proposal.finalized = true;
        require(token.transfer(proposal.recipient, proposal.amount), "Token payout failed");

        emit ProposalFinalized(_id);
    }
}