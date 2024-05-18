// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract EFrogsNFT is ERC721, Ownable {
    uint256 public tokenCounter;
    uint256 public constant MINT_PRICE = 0.0001 ether;

    /// @dev Error thrown when the transaction value is insufficient to cover the fee
    error InsufficientFee();

    constructor() ERC721("FakeEFrogs", "FAKEEFROGS") {
        tokenCounter = 0;
    }

    function createToken(address to) public payable {
        if (msg.value < MINT_PRICE) revert InsufficientFee();
        _safeMint(to, tokenCounter);
        tokenCounter++;
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
