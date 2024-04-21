// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {AbstractPortal} from "@verax-attestation-registry/verax-contracts/contracts/abstracts/AbstractPortal.sol";
import {AttestationPayload} from "@verax-attestation-registry/verax-contracts/contracts/types/Structs.sol";

/**
 * @title eFrogs Portal
 * @author alainnicolas.eth
 * @notice This contract aims to attest of eFrogs ownership
 */
contract EFrogsPortal is AbstractPortal, Ownable {
    IERC721 public eFrogsContract = IERC721(0x0Cb56F201E7aFe02E542E2D2D42c34d4ce7203F7);

    uint256 public fee;

    /// @dev Error thrown when the attestation subject is not the sender
    error SenderIsNotSubject();
    /// @dev Error thrown when the attestation subject doesn't own an eFrog
    error SenderIsNotOwner();
    /// @dev Error thrown when the transaction value is insufficient to cover the fee
    error InsufficientFee();
    /// @dev Error thrown when the withdraw fails
    error WithdrawFail();

    constructor(address[] memory modules, address router) AbstractPortal(modules, router) {
        fee = 0.0001 ether;
    }

    /**
     * @notice Run before the payload is attested
     * @param attestationPayload the attestation payload to be attested
     * @param value the value sent with the attestation
     * @dev This function checks if
     *          the sender is the subject of the attestation
     *          and if the sender owns an eFrog
     *          and if the value sent is sufficient
     */
    function _onAttest(
        AttestationPayload memory attestationPayload,
        address /*attester*/,
        uint256 value
    ) internal view override {
        address subject = address(0);

        if (attestationPayload.subject.length == 32) subject = abi.decode(attestationPayload.subject, (address));
        if (attestationPayload.subject.length == 20) subject = address(uint160(bytes20(attestationPayload.subject)));
        if (subject != msg.sender) revert SenderIsNotSubject();
        if ((eFrogsContract.balanceOf(subject)) < 1) revert SenderIsNotOwner();
        if (value < fee) revert InsufficientFee();
    }

    /**
     * @notice Set the fee required to attest
     * @param attestationFee The fee required to attest
     */
    function setFee(uint256 attestationFee) public onlyOwner {
        fee = attestationFee;
    }

    /**
     * @notice Withdraw funds from the Portal
     * @param to the address to send the funds to
     * @param amount the amount to withdraw
     * @dev Only the owner can withdraw funds
     */
    function withdraw(address payable to, uint256 amount) external override onlyOwner {
        (bool s, ) = to.call{value: amount}("");
        if (!s) revert WithdrawFail();
    }
}
