// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReputationToken} from "./ReputationToken.sol";
import {IssueStaking} from "./IssueStaking.sol";

contract DevWorkFactory {

    // Registry: Keep track of all deployed ecosystems
    struct Ecosystem {
        string name;
        address token;
        address staking;
        address deployer;
        uint256 deployedAt;
    }

    Ecosystem[] public ecosystems;

    event EcosystemDeployed(string name, address indexed token, address indexed staking, address deployer);

    // The Main Function
    function deployEcosystem(
        string memory orgName,      // e.g., "Base Core"
        string memory tokenSymbol,  // e.g., "BASE-REP"
        address verifierAddress,     // zk proofs validator
        address arbiterAddress     // Who resolves disputes?
    ) external returns (address token, address staking) {
        
        // 1. Deploy the Reputation Token
        ReputationToken repToken = new ReputationToken(orgName, tokenSymbol);
        // Ideally: new ReputationToken(orgName, tokenSymbol);

        // 2. Deploy the Staking Marketplace (no longer needs repToken)
        IssueStaking issueStaking = new IssueStaking(arbiterAddress, verifierAddress);

        // 3. THE PLUMBING (Crucial Step)
        // Authorize the Staking Contract to mint Rewards
        repToken.setMinter(address(issueStaking), true);

        // 4. THE HANDOVER
        // Transfer ownership to the user so they can manage it
        repToken.transferOwnership(msg.sender);
        issueStaking.transferOwnership(msg.sender);

        // 5. Record it
        ecosystems.push(Ecosystem({
            name: orgName,
            token: address(repToken),
            staking: address(issueStaking),
            deployer: msg.sender,
            deployedAt: block.timestamp
        }));

        emit EcosystemDeployed(orgName, address(repToken), address(issueStaking), msg.sender);

        return (address(repToken), address(issueStaking));
    }

    // Helper to get count
    function getEcosystemsCount() external view returns (uint256) {
        return ecosystems.length;
    }
}