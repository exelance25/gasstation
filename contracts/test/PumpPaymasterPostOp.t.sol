// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/PumpPaymaster.sol";
import "../lib/openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";

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

contract PumpPaymasterPostOpTest is Test {
    PumpPaymaster public paymaster;
    MockUSDC public usdc;

    address public admin = address(1);
    address public user = address(2);
    address public entryPoint = address(3);
    uint256 public signerKey = 0xA11CE;
    address public signer;

    function setUp() public {
        signer = vm.addr(signerKey);
        vm.startPrank(admin);
        usdc = new MockUSDC();
        paymaster = new PumpPaymaster(entryPoint, signer);
        vm.deal(admin, 10 ether);
        paymaster.adminAddNativeLiquidity{value: 5 ether}();
        vm.stopPrank();
        vm.prank(admin);
        usdc.transfer(user, 100 * 10 ** 6);
    }

    function test_PostOpChargesTokenUnitsNotWei() public {
        uint256 maxTokenCharge = 3_500_000; // 3.5 USDC
        uint256 maxNativeCost = 0.001 ether;
        uint256 actualGasCost = 0.0005 ether;
        uint256 deadline = block.timestamp + 120;

        bytes memory sig = _signQuote(user, address(usdc), maxTokenCharge, deadline, maxNativeCost);

        bytes memory paymasterData = abi.encode(
            user,
            address(usdc),
            maxTokenCharge,
            deadline,
            maxNativeCost,
            sig
        );

        bytes memory context = abi.encode(user, address(usdc), maxTokenCharge, maxNativeCost);

        vm.prank(user);
        usdc.approve(address(paymaster), maxTokenCharge);

        uint256 beforeBal = usdc.balanceOf(address(paymaster));

        vm.prank(entryPoint);
        paymaster.postOp(
            PumpPaymaster.PostOpMode.opSucceeded,
            context,
            actualGasCost,
            0
        );

        uint256 charged = usdc.balanceOf(address(paymaster)) - beforeBal;
        assertGt(charged, 0, "token tahsil edilmeli");
        assertLt(charged, maxTokenCharge, "wei kadar USDC cekilmemeli");
        assertLt(charged, 1_000_000, "1 USDC altinda orantili ucret");
    }

    function _signQuote(
        address quoteUser,
        address token,
        uint256 maxTokenCharge,
        uint256 deadline,
        uint256 maxNativeCost
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(quoteUser, token, maxTokenCharge, deadline, maxNativeCost, block.chainid, address(paymaster))
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, digest);
        return abi.encodePacked(r, s, v);
    }
}
