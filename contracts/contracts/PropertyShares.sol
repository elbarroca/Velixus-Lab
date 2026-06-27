// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract PropertyShares {
    string public propertyName;
    uint256 public totalShares;
    uint256 public pricePerShare;
    uint256 public sharesSold;
    mapping(address => uint256) public sharesOwned;

    event SharesPurchased(address buyer, uint256 amount);

    constructor() {
        propertyName = "RoyalCity Tower";
        totalShares = 100;
        pricePerShare = 0.01 ether;
    }

    function buyShares(uint256 shareAmount) external payable {
        require(shareAmount > 0, "share amount must be greater than zero");

        uint256 remainingShares = totalShares - sharesSold;
        require(shareAmount <= remainingShares, "not enough shares remaining");
        require(msg.value == shareAmount * pricePerShare, "incorrect ETH amount");

        sharesSold += shareAmount;
        sharesOwned[msg.sender] += shareAmount;

        emit SharesPurchased(msg.sender, shareAmount);
    }
}
