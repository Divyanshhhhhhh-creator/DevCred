// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {DeveloperToken} from "./DeveloperToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleBondingCurve
 * @notice Handles GDA -> Bonding Curve -> Uniswap V3 graduation for developer tokens
 * @dev Simplified implementation with linear bonding curve
 */
contract SimpleBondingCurve is ReentrancyGuard {
    enum Phase { GDA, BondingCurve, Graduated }
    
    // Token and developer info
    IERC20 public immutable token;
    address public immutable developer;
    
    // GDA parameters
    uint256 public immutable gdaStartTime;
    uint256 public immutable gdaStartPrice; // In wei per token
    uint256 public immutable gdaEndPrice; // Minimum price
    uint256 public constant GDA_DURATION = 24 hours;
    
    // Bonding curve parameters
    uint256 public bondingCurveBasePrice; // Set after first GDA purchase
    uint256 public constant PRICE_INCREMENT = 0.000001 ether; // Price increases per token
    uint256 public tokensSold;
    
    // Fee structure (per trade)
    uint256 public constant TOTAL_FEE_BPS = 100; // 1%
    uint256 public constant DEVELOPER_FEE_BPS = 80; // 0.8%
    uint256 public constant PROTOCOL_FEE_BPS = 20; // 0.2%
    
    // Graduation parameters
    uint256 public constant GRADUATION_THRESHOLD = 25 ether;
    uint256 public totalEthRaised;
    Phase public currentPhase;
    
    // Fee collection
    uint256 public collectedDeveloperFees;
    uint256 public collectedProtocolFees;
    address public protocolFeeReceiver;
    
    // Uniswap V3 integration (simplified - will be extended with hook)
    address public uniswapV3Pool;
    
    event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 ethAmount, uint256 price);
    event TokensSold(address indexed seller, uint256 tokenAmount, uint256 ethAmount, uint256 price);
    event PhaseChanged(Phase oldPhase, Phase newPhase);
    event GraduatedToUniswap(address indexed pool, uint256 ethLiquidity, uint256 tokenLiquidity);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    
    constructor(
        address _token,
        address _developer,
        uint256 _gdaStartPrice,
        uint256 _gdaEndPrice,
        address _protocolFeeReceiver
    ) {
        require(_developer != address(0), "Invalid developer");
        require(_gdaStartPrice > _gdaEndPrice, "Invalid GDA prices");
        require(_protocolFeeReceiver != address(0), "Invalid protocol receiver");
        
        token = IERC20(_token);
        developer = _developer;
        gdaStartTime = block.timestamp;
        gdaStartPrice = _gdaStartPrice;
        gdaEndPrice = _gdaEndPrice;
        protocolFeeReceiver = _protocolFeeReceiver;
        currentPhase = Phase.GDA;
    }
    
    /**
     * @notice Get current price per token during GDA (decreases linearly)
     */
    function getCurrentGDAPrice() public view returns (uint256) {
        if (currentPhase != Phase.GDA) return 0;
        
        uint256 elapsed = block.timestamp - gdaStartTime;
        if (elapsed >= GDA_DURATION) {
            return gdaEndPrice;
        }
        
        // Linear price decay: startPrice - ((startPrice - endPrice) * elapsed / duration)
        uint256 priceDecay = ((gdaStartPrice - gdaEndPrice) * elapsed) / GDA_DURATION;
        return gdaStartPrice - priceDecay;
    }
    
    /**
     * @notice Get current price per token during bonding curve
     */
    function getCurrentBondingCurvePrice() public view returns (uint256) {
        if (currentPhase != Phase.BondingCurve) return 0;
        
        // Linear bonding curve: basePrice + (tokensSold * priceIncrement)
        return bondingCurveBasePrice + ((tokensSold * PRICE_INCREMENT) / 10**18);
    }
    
    /**
     * @notice Get current price per token (works in any phase)
     */
    function getCurrentPrice() public view returns (uint256) {
        if (currentPhase == Phase.GDA) {
            return getCurrentGDAPrice();
        } else if (currentPhase == Phase.BondingCurve) {
            return getCurrentBondingCurvePrice();
        }
        return 0; // Graduated
    }
    
    /**
     * @notice Buy tokens with ETH
     * @param minTokensOut Minimum tokens expected (slippage protection)
     */
    function buy(uint256 minTokensOut) external payable nonReentrant returns (uint256) {
        require(currentPhase != Phase.Graduated, "Already graduated");
        require(msg.value > 0, "Must send ETH");
        
        uint256 ethAmount = msg.value;
        uint256 tokensOut;
        uint256 currentPrice;
        
        if (currentPhase == Phase.GDA) {
            // GDA purchase
            currentPrice = getCurrentGDAPrice();
            tokensOut = (ethAmount * 10**18) / currentPrice;
            
            // First purchase transitions to bonding curve
            bondingCurveBasePrice = currentPrice;
            currentPhase = Phase.BondingCurve;
            emit PhaseChanged(Phase.GDA, Phase.BondingCurve);
        } else {
            // Bonding curve purchase
            tokensOut = _calculateBondingCurveBuy(ethAmount);
            currentPrice = getCurrentBondingCurvePrice();
        }
        
        require(tokensOut >= minTokensOut, "Slippage exceeded");
        require(token.balanceOf(address(this)) >= tokensOut, "Insufficient token liquidity");
        
        // Calculate and collect fees
        uint256 totalFee = (ethAmount * TOTAL_FEE_BPS) / 10000;
        uint256 developerFee = (totalFee * DEVELOPER_FEE_BPS) / 100;
        uint256 protocolFee = totalFee - developerFee;
        
        collectedDeveloperFees += developerFee;
        collectedProtocolFees += protocolFee;
        
        uint256 ethAfterFees = ethAmount - totalFee;
        totalEthRaised += ethAfterFees;
        tokensSold += tokensOut;
        
        // Transfer tokens to buyer
        require(token.transfer(msg.sender, tokensOut), "Token transfer failed");
        
        emit TokensPurchased(msg.sender, tokensOut, ethAmount, currentPrice);
        
        // Check graduation threshold
        if (totalEthRaised >= GRADUATION_THRESHOLD && currentPhase == Phase.BondingCurve) {
            _graduateToUniswap();
        }
        
        return tokensOut;
    }
    
    /**
     * @notice Calculate tokens received for ETH amount on bonding curve
     */
    function _calculateBondingCurveBuy(uint256 ethAmount) internal view returns (uint256) {
        // Simplified: Assume average price for the purchase
        // For precise calculation, would need to integrate over the curve
        uint256 currentPrice = getCurrentBondingCurvePrice();
        return (ethAmount * 10**18) / currentPrice;
    }
    
    /**
     * @notice Sell tokens for ETH (only during bonding curve phase)
     * @param tokenAmount Amount of tokens to sell
     * @param minEthOut Minimum ETH expected (slippage protection)
     */
    function sell(uint256 tokenAmount, uint256 minEthOut) external nonReentrant returns (uint256) {
        require(currentPhase == Phase.BondingCurve, "Can only sell during bonding curve");
        require(tokenAmount > 0, "Must sell tokens");
        
        // Calculate ETH out (sell price slightly lower than buy price)
        uint256 currentPrice = getCurrentBondingCurvePrice();
        uint256 ethOut = (tokenAmount * currentPrice) / 10**18;
        
        // Apply 5% sell discount (to prevent arbitrage)
        ethOut = (ethOut * 95) / 100;
        
        require(ethOut >= minEthOut, "Slippage exceeded");
        require(address(this).balance >= ethOut, "Insufficient ETH liquidity");
        
        // Calculate and collect fees
        uint256 totalFee = (ethOut * TOTAL_FEE_BPS) / 10000;
        uint256 developerFee = (totalFee * DEVELOPER_FEE_BPS) / 100;
        uint256 protocolFee = totalFee - developerFee;
        
        collectedDeveloperFees += developerFee;
        collectedProtocolFees += protocolFee;
        
        uint256 ethAfterFees = ethOut - totalFee;
        tokensSold -= tokenAmount;
        
        // Transfer tokens from seller
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
        
        // Send ETH to seller
        (bool success, ) = msg.sender.call{value: ethAfterFees}("");
        require(success, "ETH transfer failed");
        
        emit TokensSold(msg.sender, tokenAmount, ethOut, currentPrice);
        
        return ethAfterFees;
    }
    
    /**
     * @notice Graduate to Uniswap V3 when threshold reached
     */
    function _graduateToUniswap() internal {
        require(currentPhase == Phase.BondingCurve, "Not in bonding curve phase");
        require(totalEthRaised >= GRADUATION_THRESHOLD, "Threshold not met");
        
        Phase oldPhase = currentPhase;
        currentPhase = Phase.Graduated;
        
        // Get remaining tokens and ETH for liquidity
        uint256 tokenLiquidity = token.balanceOf(address(this));
        uint256 ethLiquidity = address(this).balance - collectedDeveloperFees - collectedProtocolFees;
        
        // TODO: Create Uniswap V3 pool and add liquidity with hook
        // This will be implemented with the hook contract
        // For now, mark as graduated
        
        emit PhaseChanged(oldPhase, Phase.Graduated);
        emit GraduatedToUniswap(uniswapV3Pool, ethLiquidity, tokenLiquidity);
    }
    
    /**
     * @notice Developer withdraws collected fees
     */
    function withdrawDeveloperFees() external nonReentrant {
        require(msg.sender == developer, "Only developer");
        require(collectedDeveloperFees > 0, "No fees to withdraw");
        
        uint256 amount = collectedDeveloperFees;
        collectedDeveloperFees = 0;
        
        (bool success, ) = developer.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit FeesWithdrawn(developer, amount);
    }
    
    /**
     * @notice Protocol withdraws collected fees
     */
    function withdrawProtocolFees() external nonReentrant {
        require(msg.sender == protocolFeeReceiver, "Only protocol");
        require(collectedProtocolFees > 0, "No fees to withdraw");
        
        uint256 amount = collectedProtocolFees;
        collectedProtocolFees = 0;
        
        (bool success, ) = protocolFeeReceiver.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit FeesWithdrawn(protocolFeeReceiver, amount);
    }
    
    /**
     * @notice Get quote for buying tokens
     */
    function getBuyQuote(uint256 ethAmount) external view returns (uint256 tokensOut, uint256 pricePerToken) {
        require(currentPhase != Phase.Graduated, "Already graduated");
        
        pricePerToken = getCurrentPrice();
        if (currentPhase == Phase.GDA) {
            tokensOut = (ethAmount * 10**18) / pricePerToken;
        } else {
            tokensOut = _calculateBondingCurveBuy(ethAmount);
        }
    }
    
    /**
     * @notice Get quote for selling tokens
     */
    function getSellQuote(uint256 tokenAmount) external view returns (uint256 ethOut, uint256 pricePerToken) {
        require(currentPhase == Phase.BondingCurve, "Can only sell during bonding curve");
        
        pricePerToken = getCurrentBondingCurvePrice();
        ethOut = (tokenAmount * pricePerToken) / 10**18;
        ethOut = (ethOut * 95) / 100; // Apply sell discount
    }
}
