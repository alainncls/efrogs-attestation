// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EFrogsNFT
 * @author alain.linea.eth
 * @notice A test NFT contract for minting fake eFrogs on testnet
 * @dev This contract is only used for testing purposes on Linea Sepolia
 */
contract EFrogsNFT is ERC721, Ownable {
    /// @notice Current token ID counter
    uint256 public tokenCounter;

    /// @notice Price to mint a single NFT
    uint256 public constant MINT_PRICE = 0.0001 ether;

    /// @dev Error thrown when the transaction value is insufficient to cover the fee
    error InsufficientFee();

    /// @dev Error thrown when the withdrawal fails
    error WithdrawFailed();

    constructor() ERC721("FakeEFrogs", "FAKEEFROGS") {
        tokenCounter = 0;
    }

    /**
     * @notice Mint a new NFT to the specified address
     * @param to The address that will receive the minted NFT
     * @dev Requires payment of MINT_PRICE
     */
    function createToken(address to) public payable {
        if (msg.value < MINT_PRICE) revert InsufficientFee();
        _safeMint(to, tokenCounter);
        tokenCounter++;
    }

    /**
     * @notice Withdraw all funds from the contract
     * @dev Only callable by the contract owner
     */
    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        if (!success) revert WithdrawFailed();
    }
}
