// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DeveloperToken
 * @notice Token representing a developer's reputation and tradeable value
 * @dev Fixed supply with initial allocation + linear vesting for developer
 */
contract DeveloperToken is ERC20 {
    address public immutable developer;
    address public immutable factory;
    address public bondingCurve;
    
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant DEVELOPER_INITIAL = 10_000 * 10**18; // 10,000 tokens upfront
    uint256 public constant DEVELOPER_VESTED = 490_000_000 * 10**18; // 490M tokens to vest
    uint256 public constant MARKET_SUPPLY = 500_000_000 * 10**18; // 500M tokens for trading
    uint256 public constant VESTING_DURATION = 365 days; // 1 year linear vesting
    
    uint256 public immutable launchTime;
    uint256 public claimedVestedTokens;
    bool public initialized;
    
    event VestedTokensClaimed(address indexed developer, uint256 amount);
    event BondingCurveSet(address indexed bondingCurve);
    
    constructor(
        string memory name,
        string memory symbol,
        address _developer,
        address _factory
    ) ERC20(name, symbol) {
        require(_developer != address(0), "Invalid developer");
        require(_factory != address(0), "Invalid factory");
        
        developer = _developer;
        factory = _factory;
        launchTime = block.timestamp;
        
        // Mint initial developer allocation (10,000 tokens)
        _mint(_developer, DEVELOPER_INITIAL);
        
        // Note: Market supply minted when bonding curve is initialized
        // Note: Vested tokens (490M) are minted on-demand via claimVestedTokens()
    }
    
    /**
     * @notice Initialize bonding curve and mint market supply to it
     * @param _bondingCurve Address of the bonding curve contract
     */
    function initializeBondingCurve(address _bondingCurve) external {
        require(!initialized, "Already initialized");
        require(_bondingCurve != address(0), "Invalid bonding curve");
        require(msg.sender == factory, "Only factory can initialize");
        
        bondingCurve = _bondingCurve;
        initialized = true;
        
        // Mint market supply to bonding curve for trading
        _mint(_bondingCurve, MARKET_SUPPLY);
        
        emit BondingCurveSet(_bondingCurve);
    }
    
    /**
     * @notice Calculate how many vested tokens can be claimed
     * @return claimable Amount of tokens available to claim
     */
    function getClaimableVestedTokens() public view returns (uint256) {
        if (block.timestamp < launchTime) return 0;
        
        uint256 elapsed = block.timestamp - launchTime;
        if (elapsed >= VESTING_DURATION) {
            // All tokens vested
            return DEVELOPER_VESTED - claimedVestedTokens;
        }
        
        // Linear vesting: (vestedAmount * timeElapsed) / totalVestingTime
        uint256 totalVested = (DEVELOPER_VESTED * elapsed) / VESTING_DURATION;
        uint256 claimable = totalVested - claimedVestedTokens;
        
        return claimable;
    }
    
    /**
     * @notice Developer claims their vested tokens
     * @return claimed Amount of tokens claimed
     */
    function claimVestedTokens() external returns (uint256) {
        require(msg.sender == developer, "Only developer can claim");
        
        uint256 claimable = getClaimableVestedTokens();
        require(claimable > 0, "No tokens to claim");
        
        claimedVestedTokens += claimable;
        _mint(developer, claimable);
        
        emit VestedTokensClaimed(developer, claimable);
        return claimable;
    }
    
    /**
     * @notice Get total tokens allocated to developer (initial + vested)
     */
    function getTotalDeveloperAllocation() external pure returns (uint256) {
        return DEVELOPER_INITIAL + DEVELOPER_VESTED;
    }
    
    /**
     * @notice Check vesting progress (0-100%)
     */
    function getVestingProgress() external view returns (uint256) {
        if (block.timestamp < launchTime) return 0;
        
        uint256 elapsed = block.timestamp - launchTime;
        if (elapsed >= VESTING_DURATION) return 100;
        
        return (elapsed * 100) / VESTING_DURATION;
    }
}
