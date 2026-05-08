// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {EFrogsPortal} from "../src/EFrogsPortal.sol";
import {IRouter} from "@verax-attestation-registry/verax-contracts/contracts/interfaces/IRouter.sol";
import {AttestationPayload} from "@verax-attestation-registry/verax-contracts/contracts/types/Structs.sol";

contract MockRouter is IRouter {
    function getAttestationRegistry() external pure returns (address) {
        return address(0x1);
    }

    function getModuleRegistry() external pure returns (address) {
        return address(0x2);
    }

    function getPortalRegistry() external pure returns (address) {
        return address(0x3);
    }

    function getSchemaRegistry() external pure returns (address) {
        return address(0x4);
    }
}

contract EFrogsPortalHarness is EFrogsPortal {
    constructor(address router, address eFrogsAddress) EFrogsPortal(new address[](0), router, eFrogsAddress) {}

    function exposedOnReplace() external view {
        AttestationPayload memory payload = AttestationPayload({
            schemaId: bytes32(0),
            expirationDate: 0,
            subject: "",
            attestationData: ""
        });

        _onReplace(bytes32(0), payload, msg.sender, 0);
    }

    function exposedOnBulkReplace() external pure {
        bytes32[] memory attestationIds = new bytes32[](0);
        AttestationPayload[] memory payloads = new AttestationPayload[](0);
        bytes[][] memory validationPayloads = new bytes[][](0);

        _onBulkReplace(attestationIds, payloads, validationPayloads);
    }
}

contract EFrogsPortalSecurityTest {
    function test_ReplaceHookIsDisabled() public {
        EFrogsPortalHarness portal = new EFrogsPortalHarness(address(new MockRouter()), address(0));

        (bool success, bytes memory revertData) = address(portal).call(
            abi.encodeCall(EFrogsPortalHarness.exposedOnReplace, ())
        );

        require(!success, "replace hook should revert");
        require(bytes4(revertData) == EFrogsPortal.NotImplemented.selector, "unexpected replace error");
    }

    function test_BulkReplaceHookIsDisabled() public {
        EFrogsPortalHarness portal = new EFrogsPortalHarness(address(new MockRouter()), address(0));

        (bool success, bytes memory revertData) = address(portal).call(
            abi.encodeCall(EFrogsPortalHarness.exposedOnBulkReplace, ())
        );

        require(!success, "bulk replace hook should revert");
        require(bytes4(revertData) == EFrogsPortal.NotImplemented.selector, "unexpected bulk replace error");
    }
}
