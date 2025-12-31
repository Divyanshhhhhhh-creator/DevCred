// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract IssueStaking is Ownable {
    enum Status { Open, Assigned, Submitted, Accepted, Rejected, Disputed, Closed }

    struct Issue {
        address owner;
        address assignee;
        uint256 ownerStake;
        uint256 assigneeStake;
        uint256 reward; // in wei (ETH payment)
        uint256 deadline; // timestamp by which work should be accepted
        Status status;
        string evidenceURI;
    }

    address public arbiter; // can be a contract that decides disputes
    address public verifier; // who verifies ZK proofs
    uint256 public challengeWindow = 3 days;

    // Reputation Points: ecosystem gives points to developers (not an ERC20)
    mapping(address => uint256) public reputationPoints; // developer => total reputation points
    mapping(address => uint256) public lockedReputation; // developer => locked reputation points
    mapping(address => bool) public isRegistered; // track registered developers

    mapping(uint256 => Issue) public issues; // issueId -> Issue
    uint256 public nextIssueId;
    uint256 public constant INITIAL_REPUTATION = 50; // Starting reputation for new developers

    event IssueCreated(uint256 indexed id, address owner, uint256 ownerStake, uint256 reward, uint256 deadline);
    event Assigned(uint256 indexed id, address assignee, uint256 stake);
    event Submitted(uint256 indexed id, string evidence);
    event Accepted(uint256 indexed id);
    event Rejected(uint256 indexed id);
    event Slashed(uint256 indexed id, address who, uint256 amount);
    event ReputationAwarded(address indexed developer, uint256 amount);
    event ReputationSlashed(address indexed developer, uint256 amount);
    event DeveloperRegistered(address indexed developer, uint256 initialReputation);

    constructor(address _arbiter, address _verifier) Ownable(msg.sender) {
        arbiter = _arbiter;
        verifier = _verifier;
    }

    // New developers register to receive initial 50 reputation points
    function registerDeveloper() external {
        require(!isRegistered[msg.sender], "Already registered");
        isRegistered[msg.sender] = true;
        reputationPoints[msg.sender] = INITIAL_REPUTATION;
        emit DeveloperRegistered(msg.sender, INITIAL_REPUTATION);
    }

    // Function for ecosystem to award reputation points to developers
    function awardReputation(address developer, uint256 amount) external onlyOwner {
        reputationPoints[developer] += amount;
        emit ReputationAwarded(developer, amount);
    }

    // Internal function to lock reputation points
    function _lockReputation(address user, uint256 amount) internal {
        require(reputationPoints[user] - lockedReputation[user] >= amount, "Insufficient unlocked reputation");
        lockedReputation[user] += amount;
    }

    // Internal function to unlock reputation points
    function _unlockReputation(address user, uint256 amount) internal {
        require(lockedReputation[user] >= amount, "Insufficient locked reputation");
        lockedReputation[user] -= amount;
    }

    // Internal function to slash reputation points (removes from total)
    function _slashReputation(address user, uint256 amount) internal {
        require(lockedReputation[user] >= amount, "Insufficient locked reputation");
        lockedReputation[user] -= amount;
        reputationPoints[user] -= amount;
        emit ReputationSlashed(user, amount);
    }

    // Helper to get available (unlocked) reputation
    function getAvailableReputation(address user) external view returns (uint256) {
        return reputationPoints[user] - lockedReputation[user];
    }

    modifier onlyAssignee(uint256 id) {
        _checkAssignee(id);
        _;
    }

    modifier onlyVerifier() {
        _checkVerifier();
        _;
    }

    function _checkAssignee(uint256 id) internal view {
        require(msg.sender == issues[id].assignee, "not assignee");
    }

    function _checkVerifier() internal view {
        require(msg.sender == verifier, "not verifier");
    }

    // Owner creates issue and locks owner stake
    function createIssue(uint256 ownerStake, uint256 deadline) external payable returns (uint256) {
        require(ownerStake > 0, "owner stake required");
        require(deadline > block.timestamp + 1 hours, "deadline too soon");

        // Lock owner's reputation points
        _lockReputation(msg.sender, ownerStake);

        uint256 id = nextIssueId++;
        issues[id] = Issue({
            owner: msg.sender,
            assignee: address(0),
            ownerStake: ownerStake,
            assigneeStake: 0,
            reward: msg.value,
            deadline: deadline,
            status: Status.Open,
            evidenceURI: ""
        });

        emit IssueCreated(id, msg.sender, ownerStake, msg.value, deadline);
        return id;
    }

    // Assignee accepts and locks their rep
    function acceptAssignment(uint256 id, uint256 stake) external {
        Issue storage it = issues[id];
        require(it.status == Status.Open, "not open");
        require(stake > 0, "stake > 0");

        // Lock assignee's reputation points
        _lockReputation(msg.sender, stake);
        
        it.assignee = msg.sender;
        it.assigneeStake = stake;
        it.status = Status.Assigned;

        emit Assigned(id, msg.sender, stake);
    }

    // Assignee submits work evidence (link to PR/commit)
    function submitWork(uint256 id, string calldata evidenceURI) external onlyAssignee(id) {
        Issue storage it = issues[id];
        require(it.status == Status.Assigned, "not assigned");
        it.evidenceURI = evidenceURI;
        it.status = Status.Submitted;
        emit Submitted(id, evidenceURI);
    }

    // Verifier completes based on ZK proof
    function completeByProof(uint256 id, string calldata evidenceURI) external onlyVerifier {
        Issue storage it = issues[id];
        require(it.status == Status.Assigned, "Not active");

        // A. Update State
        it.status = Status.Accepted;
        it.evidenceURI = evidenceURI;

        // B. Payout
        // 1. Return the assignee's locked reputation points
        _unlockReputation(it.assignee, it.assigneeStake);
        
        // 2. Pay the ETH reward (if any)
        if (it.reward > 0) {
            payable(it.assignee).transfer(it.reward);
        }

        emit Accepted(id);
    }

    // Finalize after challenge window or immediate if verified by arbiter/verifier
    function finalize(uint256 id) external {
        Issue storage it = issues[id];
        require(it.status == Status.Accepted || it.status == Status.Submitted || it.status == Status.Assigned, "cannot finalize");
        if (it.status == Status.Accepted) {
            // require challengeWindow expired OR caller is arbiter/verifier
            // for simplicity: if the deadline + challengeWindow passed OR caller == arbiter
            if (block.timestamp < it.deadline + challengeWindow && msg.sender != arbiter) {
                revert("challenge window active");
            }
            // Return stakes (unlock reputation points)
            _unlockReputation(it.owner, it.ownerStake);
            _unlockReputation(it.assignee, it.assigneeStake);
            
            // pay ETH reward if any
            if (it.reward > 0) {
                payable(it.assignee).transfer(it.reward);
            }
            it.status = Status.Closed;
            return;
        }

        // If deadline passed without submission -> slash assignee
        if (block.timestamp > it.deadline && it.status != Status.Submitted && it.status == Status.Assigned) {
            uint256 slashAmt = it.assigneeStake;
            // Slash assignee's reputation
            _slashReputation(it.assignee, slashAmt);
            
            // Award slashed reputation to owner
            reputationPoints[it.owner] += slashAmt;
            
            // unlock owner stake back
            _unlockReputation(it.owner, it.ownerStake);
            
            it.status = Status.Closed;
            emit Slashed(id, it.assignee, slashAmt);
            return;
        }

        revert("cannot finalize yet");
    }

    // Arbiter resolves disputes: 0 = owner wins (slash assignee), 1 = assignee wins (slash owner)
    function resolveByArbiter(uint256 id, uint8 outcome) external {
        require(msg.sender == arbiter, "only arbiter");
        Issue storage it = issues[id];
        require(it.status == Status.Submitted || it.status == Status.Disputed || it.status == Status.Assigned, "no dispute");

        if (outcome == 0) {
            // owner wins -> slash assignee
            uint256 s = it.assigneeStake;
            _slashReputation(it.assignee, s);
            
            // Award slashed reputation + return owner's stake
            reputationPoints[it.owner] += s;
            _unlockReputation(it.owner, it.ownerStake);
            
            // Return ETH reward to owner
            if (it.reward > 0) payable(it.owner).transfer(it.reward);
        } else {
            // assignee wins -> slash owner
            uint256 s = it.ownerStake;
            _slashReputation(it.owner, s);
            
            // Award slashed reputation + return assignee's stake
            reputationPoints[it.assignee] += s;
            _unlockReputation(it.assignee, it.assigneeStake);
            
            // Pay ETH reward to assignee
            if (it.reward > 0) payable(it.assignee).transfer(it.reward);
        }

        it.status = Status.Closed;
    }

    // helper: let owner or assignee withdraw reward if appropriate (not shown)
}