// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/PumpPaymaster.sol";

/// @notice USDC simulasyonu (6 decimals)
contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor() {
        balanceOf[msg.sender] = 1_000_000 * 10 ** 6;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        return true;
    }
}

contract PumpPaymasterTest is Test {
    PumpPaymaster public paymaster;
    MockUSDC public usdc;

    address public admin = address(1);
    address public user = address(2);
    address public entryPoint = address(3);
    address public signer = address(4);

    function setUp() public {
        vm.startPrank(admin);
        usdc = new MockUSDC();
        paymaster = new PumpPaymaster(entryPoint, signer);

        vm.deal(admin, 10 ether);
        paymaster.adminAddNativeLiquidity{value: 5 ether}();
        vm.stopPrank();

        vm.prank(admin);
        usdc.transfer(user, 100 * 10 ** 6);
    }

    /// TEST 1: Sadece admin havuzdan cekebilir.
    function test_OnlyAdminCanWithdraw() public {
        vm.startPrank(user);
        vm.expectRevert("PumpStation: Sadece Admin erisebilir");
        paymaster.adminWithdraw(address(0), 1 ether);
        vm.stopPrank();
    }

    /// TEST 2: Manuel gas alimi (USDC -> ETH)
    function test_ManuelGasPurchase() public {
        uint256 usdcAmount = 4_500_000; // 4.5 USDC (6 decimals)
        uint256 expectedGas = 0.001 ether;

        vm.startPrank(user);
        usdc.approve(address(paymaster), usdcAmount);

        uint256 userBalanceBefore = user.balance;
        paymaster.buyGasManuel(address(usdc), usdcAmount, expectedGas, user);
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(paymaster)), usdcAmount, "paymaster token bakiyesi");
        assertEq(user.balance, userBalanceBefore + expectedGas, "kullanici ETH bakiyesi");
    }
}

