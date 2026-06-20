// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {TestNetworkNFT} from "../src/TestNetworkNFT.sol";

contract TestNetworkNFTTest is Test {
    TestNetworkNFT internal nft;
    address internal alice = address(0xA11CE);
    address internal treasury = address(0xBEEF);

    uint256 internal constant MAX_SUPPLY = 200;
    uint256 internal constant MINT_PRICE = 0.0001 ether;

    function setUp() public {
        nft = new TestNetworkNFT(
            "Monad Test NFT",
            "MTNFT",
            "https://example.com/monad/metadata.json",
            MAX_SUPPLY,
            MINT_PRICE,
            treasury
        );
    }

    function test_mint_success_payment_to_treasury() public {
        vm.deal(alice, 1 ether);
        uint256 treasuryBefore = treasury.balance;

        vm.prank(alice);
        nft.mint{value: MINT_PRICE}();

        assertEq(nft.ownerOf(0), alice);
        assertEq(nft.totalMinted(), 1);
        assertEq(nft.balanceOf(alice), 1);
        assertEq(treasury.balance, treasuryBefore + MINT_PRICE);
        assertEq(address(nft).balance, 0);
    }

    function test_mint_reverts_on_low_payment() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                TestNetworkNFT.InsufficientPayment.selector,
                MINT_PRICE - 1,
                MINT_PRICE
            )
        );
        nft.mint{value: MINT_PRICE - 1}();
    }

    function test_withdraw_recovers_accidental_eth() public {
        vm.deal(address(nft), 1 ether);
        uint256 treasuryBefore = treasury.balance;

        vm.prank(treasury);
        nft.withdraw();

        assertEq(address(nft).balance, 0);
        assertEq(treasury.balance, treasuryBefore + 1 ether);
    }

    function test_max_supply() public {
        for (uint256 i = 0; i < MAX_SUPPLY; i++) {
            address minter = address(uint160(0x1000 + i));
            vm.deal(minter, MINT_PRICE);
            vm.prank(minter);
            nft.mint{value: MINT_PRICE}();
        }

        address extra = address(0xDEAD);
        vm.deal(extra, MINT_PRICE);
        vm.prank(extra);
        vm.expectRevert(TestNetworkNFT.MaxSupplyReached.selector);
        nft.mint{value: MINT_PRICE}();
    }
}
