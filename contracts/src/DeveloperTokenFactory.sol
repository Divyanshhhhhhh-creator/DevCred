// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {DeveloperToken} from "./DeveloperToken.sol";
import {SimpleBondingCurve} from "./SimpleBondingCurve.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DeveloperTokenFactory
 * @notice Factory for deploying developer tokens with bonding curves
 * @dev Creates paired token + bonding curve contracts
 */
contract DeveloperTokenFactory is Ownable {
    struct TokenLaunch {
        address token;
        address bondingCurve;
        address developer;
        uint256 launchTime;
        string name;
        string symbol;
        uint256 gdaStartPrice;
    }
    
    // Registry of all launched tokens
    TokenLaunch[] public launches;
    mapping(address => address[]) public developerToTokens;
    mapping(address => TokenLaunch) public tokenToLaunch;
    
    address public protocolFeeReceiver;
    
    // Default GDA parameters
    uint256 public constant DEFAULT_GDA_START_PRICE = 0.001 ether; // 0.001 ETH per token
    uint256 public constant DEFAULT_GDA_END_PRICE = 0.0001 ether; // 0.0001 ETH per token
    
    event TokenLaunched(
        address indexed developer,
        address indexed token,
        address indexed bondingCurve,
        string name,
        string symbol,
        uint256 gdaStartPrice
    );
    
    constructor(address _protocolFeeReceiver) Ownable(msg.sender) {
        require(_protocolFeeReceiver != address(0), "Invalid protocol receiver");
        protocolFeeReceiver = _protocolFeeReceiver;
    }
    
    /**
     * @notice Launch a new developer token with custom GDA pricing
     * @param name Token name (e.g., "Developer John Token")
     * @param symbol Token symbol (e.g., "JOHN")
     * @param gdaStartPrice Starting price for GDA (in wei per token)
     * @param gdaEndPrice Ending price for GDA (in wei per token)
     */
    function launchToken(
        string memory name,
        string memory symbol,
        uint256 gdaStartPrice,
        uint256 gdaEndPrice
    ) public returns (address token, address bondingCurve) {
        require(bytes(name).length > 0, "Invalid name");
        require(bytes(symbol).length > 0, "Invalid symbol");
        require(gdaStartPrice > gdaEndPrice, "Invalid GDA prices");
        require(gdaEndPrice > 0, "GDA end price must be > 0");
        
        // Step 1: Deploy developer token (without bonding curve yet)
        DeveloperToken devToken = new DeveloperToken(
            name,
            symbol,
            msg.sender,
            address(this)
        );
        
        token = address(devToken);
        
        // Step 2: Deploy bonding curve with token address
        SimpleBondingCurve curve = new SimpleBondingCurve(
            token,
            msg.sender,
            gdaStartPrice,
            gdaEndPrice,
            protocolFeeReceiver
        );
        
        bondingCurve = address(curve);
        
        // Step 3: Initialize token with bonding curve (mints market supply to curve)
        devToken.initializeBondingCurve(bondingCurve);
        
        // Store launch info
        TokenLaunch memory launch = TokenLaunch({
            token: token,
            bondingCurve: bondingCurve,
            developer: msg.sender,
            launchTime: block.timestamp,
            name: name,
            symbol: symbol,
            gdaStartPrice: gdaStartPrice
        });
        
        launches.push(launch);
        developerToTokens[msg.sender].push(token);
        tokenToLaunch[token] = launch;
        
        emit TokenLaunched(msg.sender, token, bondingCurve, name, symbol, gdaStartPrice);
        
        return (token, bondingCurve);
    }
    
    /**
     * @notice Launch token with default GDA parameters
     */
    function launchTokenWithDefaults(
        string memory name,
        string memory symbol
    ) external returns (address token, address bondingCurve) {
        return launchToken(name, symbol, DEFAULT_GDA_START_PRICE, DEFAULT_GDA_END_PRICE);
    }
    
    /**
     * @notice Get all tokens launched by a developer
     */
    function getDeveloperTokens(address developer) external view returns (address[] memory) {
        return developerToTokens[developer];
    }
    
    /**
     * @notice Get launch info for a token
     */
    function getLaunchInfo(address token) external view returns (TokenLaunch memory) {
        return tokenToLaunch[token];
    }
    
    /**
     * @notice Get total number of launches
     */
    function getTotalLaunches() external view returns (uint256) {
        return launches.length;
    }
    
    /**
     * @notice Get launch by index
     */
    function getLaunchByIndex(uint256 index) external view returns (TokenLaunch memory) {
        require(index < launches.length, "Index out of bounds");
        return launches[index];
    }
    
    /**
     * @notice Update protocol fee receiver
     */
    function setProtocolFeeReceiver(address _protocolFeeReceiver) external onlyOwner {
        require(_protocolFeeReceiver != address(0), "Invalid address");
        protocolFeeReceiver = _protocolFeeReceiver;
    }
    
    /**
     * @notice Get all launches (paginated)
     */
    function getLaunches(uint256 offset, uint256 limit) external view returns (TokenLaunch[] memory) {
        require(offset < launches.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > launches.length) {
            end = launches.length;
        }
        
        uint256 size = end - offset;
        TokenLaunch[] memory result = new TokenLaunch[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = launches[offset + i];
        }
        
        return result;
    }
}
