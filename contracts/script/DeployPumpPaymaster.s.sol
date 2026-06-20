// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PumpPaymaster} from "../src/PumpPaymaster.sol";

/// @title DeployPumpPaymaster
/// @notice PumpPaymaster v2 — imzalı postOp token ücreti
/// @dev Env: DEPLOYER_PRIVATE_KEY, ENTRY_POINT_ADDRESS (opsiyonel), PRICE_SIGNER_ADDRESS
contract DeployPumpPaymaster is Script {
    address constant DEFAULT_ENTRY_POINT = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address entryPoint = vm.envOr("ENTRY_POINT_ADDRESS", DEFAULT_ENTRY_POINT);
        address priceSigner = vm.envOr(
            "PRICE_SIGNER_ADDRESS",
            address(0x0000000000000000000000000000000000000001)
        );

        vm.startBroadcast(deployerKey);

        PumpPaymaster paymaster = new PumpPaymaster(entryPoint, priceSigner);

        vm.stopBroadcast();

        console2.log("PumpPaymaster v2 deployed at:", address(paymaster));
        console2.log("EntryPoint:", entryPoint);
        console2.log("PriceSigner:", priceSigner);
        console2.log("Vault label:", paymaster.vaultLabel());
        console2.log("");
        console2.log("Add to .env.local:");
        console2.log("NEXT_PUBLIC_PUMP_PAYMASTER_ADDRESS=", address(paymaster));
        console2.log("NEXT_PUBLIC_ENTRY_POINT_ADDRESS=", entryPoint);
        console2.log("PRICE_SIGNER_ADDRESS=", priceSigner);
    }
}
