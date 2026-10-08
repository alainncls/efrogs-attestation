// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {EFrogsPortal} from "../src/EFrogsPortal.sol";
import {IRouter} from "@verax-attestation-registry/verax-contracts/contracts/interfaces/IRouter.sol";
import {AttestationPayload, Portal} from "@verax-attestation-registry/verax-contracts/contracts/types/Structs.sol";
import {OperationType} from "@verax-attestation-registry/verax-contracts/contracts/types/Enums.sol";

contract MockPortalRegistry {
    address public owner;

    constructor(address initialOwner) {
        owner = initialOwner;
    }

    function setOwner(address nextOwner) external {
        owner = nextOwner;
    }

    function getPortalOwner(address) external view returns (address) {
        return owner;
    }

    function getPortalByAddress(address id) external view returns (Portal memory portal) {
        portal.id = id;
        portal.ownerAddress = owner;
    }
}

contract MockAttestationRegistry {
    uint256 public attestCount;

    function attest(AttestationPayload calldata, address) external {
        attestCount++;
    }
}

contract MockModuleRegistry {
    function runModulesV2(
        address[] calldata,
        AttestationPayload calldata,
        bytes[] calldata,
        uint256,
        address,
        address,
        OperationType
    ) external pure {}

    function bulkRunModulesV2(
        address[] calldata,
        AttestationPayload[] calldata,
        bytes[][] calldata,
        address,
        address,
        OperationType
    ) external pure {}
}

contract MockRouter is IRouter {
    address public immutable attestationRegistry;
    address public immutable moduleRegistry;
    address public immutable portalRegistry;

    constructor(address attestationRegistry_, address moduleRegistry_, address portalRegistry_) {
        attestationRegistry = attestationRegistry_;
        moduleRegistry = moduleRegistry_;
        portalRegistry = portalRegistry_;
    }

    function getAttestationRegistry() external view returns (address) {
        return attestationRegistry;
    }

    function getModuleRegistry() external view returns (address) {
        return moduleRegistry;
    }

    function getPortalRegistry() external view returns (address) {
        return portalRegistry;
    }

    function getSchemaRegistry() external pure returns (address) {
        return address(0x4);
    }
}

contract MockEFrogsNFT {
    mapping(address => uint256) public balances;

    function setBalance(address account, uint256 balance) external {
        balances[account] = balance;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}

contract MockUnauthorizedCaller {
    function setFee(EFrogsPortal portal) external {
        portal.setFee(0);
    }

    function addSchema(EFrogsPortal portal, bytes32 schemaId) external {
        portal.addAuthorizedSchema(schemaId);
    }

    function removeSchema(EFrogsPortal portal, bytes32 schemaId) external {
        portal.removeAuthorizedSchema(schemaId);
    }

    function withdraw(EFrogsPortal portal, address payable recipient) external {
        portal.withdraw(recipient, 0);
    }

    function revoke(EFrogsPortal portal) external {
        portal.revoke(bytes32(0));
    }

    function replace(EFrogsPortal portal) external {
        AttestationPayload memory payload;
        bytes[] memory validations = new bytes[](0);
        portal.replace(bytes32(0), payload, validations);
    }
}

contract RejectEther {
    receive() external payable {
        revert("rejected");
    }
}

interface IEFrogsPortalTestEntrypoints {
    function attest(AttestationPayload memory attestationPayload, bytes[] memory validationPayloads) external payable;
    function bulkAttest(AttestationPayload[] memory attestationPayloads, bytes[][] memory validationPayloads) external;
    function replace(
        bytes32 attestationId,
        AttestationPayload memory attestationPayload,
        bytes[] memory validationPayloads
    ) external payable;
}

contract EFrogsPortalSecurityTest {
    bytes32 private constant AUTHORIZED_SCHEMA = 0x5dc8bc9158dd69ee8a234bb8f9ab1f4f17bb52c84b6fd4720d58ec82bb43d2f5;
    bytes32 private constant OTHER_SCHEMA = keccak256("other schema");

    MockPortalRegistry private portalRegistry;
    MockAttestationRegistry private attestationRegistry;
    MockEFrogsNFT private nft;
    EFrogsPortal private portal;

    function setUp() public {
        portalRegistry = new MockPortalRegistry(address(this));
        attestationRegistry = new MockAttestationRegistry();
        nft = new MockEFrogsNFT();
        MockRouter router = new MockRouter(
            address(attestationRegistry),
            address(new MockModuleRegistry()),
            address(portalRegistry)
        );
        portal = new EFrogsPortal(new address[](0), address(router), address(nft));
        nft.setBalance(address(this), 2);
    }

    function test_AttestAcceptsTwentyAndThirtyTwoByteSubjectsAtExactFee() public {
        AttestationPayload memory shortSubject = _payload(
            abi.encodePacked(address(this)),
            AUTHORIZED_SCHEMA,
            address(nft),
            2
        );
        portal.attest{value: portal.fee()}(shortSubject, new bytes[](0));

        AttestationPayload memory wordSubject = _payload(abi.encode(address(this)), AUTHORIZED_SCHEMA, address(nft), 2);
        portal.attest{value: portal.fee()}(wordSubject, new bytes[](0));

        require(attestationRegistry.attestCount() == 2, "both supported subject encodings must attest");
    }

    function test_AttestRejectsUnderpayment() public {
        AttestationPayload memory payload = _validPayload();
        (bool success, bytes memory reason) = address(portal).call{value: portal.fee() - 1}(
            abi.encodeCall(IEFrogsPortalTestEntrypoints.attest, (payload, new bytes[](0)))
        );
        _expectRevert(success, reason, EFrogsPortal.InsufficientFee.selector);
    }

    function test_AttestRejectsMalformedAndMismatchedSubjects() public {
        AttestationPayload memory malformed = _validPayload();
        malformed.subject = hex"010203";
        (bool malformedSuccess, bytes memory malformedReason) = address(portal).call{value: portal.fee()}(
            abi.encodeCall(IEFrogsPortalTestEntrypoints.attest, (malformed, new bytes[](0)))
        );
        _expectRevert(malformedSuccess, malformedReason, EFrogsPortal.SenderIsNotSubject.selector);

        AttestationPayload memory mismatch = _payload(abi.encode(address(0x1234)), AUTHORIZED_SCHEMA, address(nft), 2);
        (bool mismatchSuccess, bytes memory mismatchReason) = address(portal).call{value: portal.fee()}(
            abi.encodeCall(IEFrogsPortalTestEntrypoints.attest, (mismatch, new bytes[](0)))
        );
        _expectRevert(mismatchSuccess, mismatchReason, EFrogsPortal.SenderIsNotSubject.selector);
    }

    function test_AttestRejectsZeroNFTBalance() public {
        nft.setBalance(address(this), 0);
        (bool success, bytes memory reason) = address(portal).call{value: portal.fee()}(
            abi.encodeCall(IEFrogsPortalTestEntrypoints.attest, (_validPayload(), new bytes[](0)))
        );
        _expectRevert(success, reason, EFrogsPortal.SenderIsNotOwner.selector);
    }

    function test_AttestRejectsUnauthorizedSchemaAndWrongTokenData() public {
        AttestationPayload memory wrongSchema = _payload(abi.encode(address(this)), OTHER_SCHEMA, address(nft), 2);
        (bool schemaSuccess, bytes memory schemaReason) = address(portal).call{value: portal.fee()}(
            abi.encodeCall(IEFrogsPortalTestEntrypoints.attest, (wrongSchema, new bytes[](0)))
        );
        _expectRevert(schemaSuccess, schemaReason, EFrogsPortal.SchemaNotAuthorized.selector);

        AttestationPayload memory wrongToken = _payload(abi.encode(address(this)), AUTHORIZED_SCHEMA, address(0x1234), 2);
        (bool tokenSuccess, bytes memory tokenReason) = address(portal).call{value: portal.fee()}(
            abi.encodeCall(IEFrogsPortalTestEntrypoints.attest, (wrongToken, new bytes[](0)))
        );
        _expectRevert(tokenSuccess, tokenReason, EFrogsPortal.NotEFrogsContract.selector);

        AttestationPayload memory wrongBalance = _payload(abi.encode(address(this)), AUTHORIZED_SCHEMA, address(nft), 1);
        (bool balanceSuccess, bytes memory balanceReason) = address(portal).call{value: portal.fee()}(
            abi.encodeCall(IEFrogsPortalTestEntrypoints.attest, (wrongBalance, new bytes[](0)))
        );
        _expectRevert(balanceSuccess, balanceReason, EFrogsPortal.IncorrectBalance.selector);
    }

    function test_OwnerCanChangeFeeAndSchemaAuthorization() public {
        portal.setFee(7);
        require(portal.fee() == 7, "owner can set fee");
        portal.addAuthorizedSchema(OTHER_SCHEMA);
        require(portal.authorizedSchemas(OTHER_SCHEMA), "owner can add schema");
        portal.removeAuthorizedSchema(OTHER_SCHEMA);
        require(!portal.authorizedSchemas(OTHER_SCHEMA), "owner can remove schema");
    }

    function test_ManagementAndPortalOwnerEntryPointsRejectUnauthorizedCaller() public {
        MockUnauthorizedCaller attacker = new MockUnauthorizedCaller();

        (bool feeSuccess, ) = address(attacker).call(abi.encodeCall(attacker.setFee, (portal)));
        require(!feeSuccess, "only Ownable owner can set fee");
        (bool addSuccess, ) = address(attacker).call(abi.encodeCall(attacker.addSchema, (portal, OTHER_SCHEMA)));
        require(!addSuccess, "only Ownable owner can add schema");
        (bool removeSuccess, ) = address(attacker).call(
            abi.encodeCall(attacker.removeSchema, (portal, AUTHORIZED_SCHEMA))
        );
        require(!removeSuccess, "only Ownable owner can remove schema");
        (bool withdrawSuccess, ) = address(attacker).call(
            abi.encodeCall(attacker.withdraw, (portal, payable(address(attacker))))
        );
        require(!withdrawSuccess, "only Ownable owner can withdraw");
        (bool revokeSuccess, ) = address(attacker).call(abi.encodeCall(attacker.revoke, (portal)));
        require(!revokeSuccess, "only portal owner can revoke");
        (bool replaceSuccess, ) = address(attacker).call(abi.encodeCall(attacker.replace, (portal)));
        require(!replaceSuccess, "only portal owner can replace");
    }

    function test_FailedWithdrawalRevertsWithoutChangingBalance() public {
        portal.attest{value: portal.fee()}(_validPayload(), new bytes[](0));
        uint256 balanceBefore = address(portal).balance;
        RejectEther recipient = new RejectEther();
        (bool success, bytes memory reason) = address(portal).call(
            abi.encodeCall(EFrogsPortal.withdraw, (payable(address(recipient)), balanceBefore))
        );
        _expectRevert(success, reason, bytes4(keccak256("WithdrawFail()")));
        require(address(portal).balance == balanceBefore, "failed withdrawal must roll back");
    }

    function test_BulkAttestAndReplaceAreNotImplemented() public {
        AttestationPayload[] memory payloads = new AttestationPayload[](0);
        bytes[][] memory validations = new bytes[][](0);
        (bool bulkSuccess, bytes memory bulkReason) = address(portal).call(
            abi.encodeCall(IEFrogsPortalTestEntrypoints.bulkAttest, (payloads, validations))
        );
        _expectRevert(bulkSuccess, bulkReason, EFrogsPortal.NotImplemented.selector);

        AttestationPayload memory payload;
        bytes[] memory validationPayloads = new bytes[](0);
        (bool replaceSuccess, bytes memory replaceReason) = address(portal).call(
            abi.encodeCall(IEFrogsPortalTestEntrypoints.replace, (bytes32(0), payload, validationPayloads))
        );
        _expectRevert(replaceSuccess, replaceReason, EFrogsPortal.NotImplemented.selector);
    }

    function _validPayload() private view returns (AttestationPayload memory) {
        return _payload(abi.encode(address(this)), AUTHORIZED_SCHEMA, address(nft), 2);
    }

    function _payload(
        bytes memory subject,
        bytes32 schema,
        address token,
        uint256 balance
    ) private pure returns (AttestationPayload memory) {
        return
            AttestationPayload({
                schemaId: schema,
                expirationDate: 0,
                subject: subject,
                attestationData: abi.encode(token, balance)
            });
    }

    function _expectRevert(bool success, bytes memory reason, bytes4 expected) private pure {
        require(!success, "expected call to revert");
        require(reason.length >= 4 && bytes4(reason) == expected, "unexpected revert selector");
    }
}
