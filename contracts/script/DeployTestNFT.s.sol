// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {TestNetworkNFT} from "../src/TestNetworkNFT.sol";

/// @title DeployTestNFT
/// @notice Foundry deploy script — run once per network (Monad Testnet, Base Sepolia).
/// @dev Required env: DEPLOYER_PRIVATE_KEY, NFT_NAME, NFT_SYMBOL, NFT_METADATA_URI,
///      NFT_MAX_SUPPLY, NFT_MINT_PRICE_WEI, NFT_TREASURY (or NFT_OWNER)
contract DeployTestNFT is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        string memory name = vm.envString("NFT_NAME");
        string memory symbol = vm.envString("NFT_SYMBOL");
        string memory metadataUri = vm.envString("NFT_METADATA_URI");
        uint256 maxSupply = vm.envUint("NFT_MAX_SUPPLY");
        uint256 mintPriceWei = vm.envUint("NFT_MINT_PRICE_WEI");
        address treasury = vm.envAddress("NFT_TREASURY");

        vm.startBroadcast(deployerKey);

        TestNetworkNFT nft = new TestNetworkNFT(
            name,
            symbol,
            metadataUri,
            maxSupply,
            mintPriceWei,
            treasury
        );

        vm.stopBroadcast();

        console2.log("TestNetworkNFT deployed at:", address(nft));
        console2.log("Vault label:", nft.vaultLabel());
        console2.log("Max supply:", nft.maxSupply());
        console2.log("Mint price (wei):", nft.mintPrice());
    }
}
