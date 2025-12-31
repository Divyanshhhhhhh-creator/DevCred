// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationToken is ERC20, Ownable {
    mapping(address => bool) public isMinter;
    constructor(string memory _name, string memory _symbol) 
        ERC20(_name, _symbol) 
        Ownable(msg.sender) 
    {
        // Mint initial supply to Factory (who triggers this), 
        // Factory should then transfer it to the Org Owner
        _mint(msg.sender, 100 * 10**18); 
    }

    modifier onlyMinter() {
        _checkMinter();
        _;
    }

    function _checkMinter() internal view {
        require(isMinter[msg.sender] || msg.sender == owner(), "Not a minter");
    }

    function setMinter(address minter, bool status) external onlyOwner {
        isMinter[minter] = status;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
}