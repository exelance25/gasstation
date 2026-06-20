// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {ECDSA} from "../lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "../lib/openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";

interface IEntryPoint {
    function depositTo(address account) external payable;
}

/// @title PumpPaymaster
/// @notice Admin likidite + manuel gas + ERC-4337 otomatik fee (imzalı token tutarı)
/// @dev postOp: native wei maliyeti orantılı olarak ERC-20 token birimine çevrilir
contract PumpPaymaster {
    address public owner;
    address public immutable entryPoint;
    address public priceSigner;

    uint256 public constant feeMultiplier = 10050;
    uint256 public constant bpsDivider = 10000;
    string public constant VAULT_LABEL = "PUMPSTATION";

    function vaultLabel() external pure returns (string memory) {
        return VAULT_LABEL;
    }

    enum PostOpMode {
        opSucceeded,
        opReverted,
        postOpReverted
    }

    struct UserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes paymasterAndData;
        bytes signature;
    }

    struct PaymasterContext {
        address user;
        address tokenToPay;
        uint256 maxTokenCharge;
        uint256 maxNativeCost;
    }

    event LiquidityAdded(address indexed token, uint256 amount);
    event ManuelGasPurchased(
        address indexed user,
        address indexed tokenPaid,
        uint256 amountPaid,
        uint256 gasReceived
    );
    event AutoGasPaid(address indexed user, uint256 actualGasCost, uint256 tokenCharged);
    event PriceSignerUpdated(address indexed signer);
    event OwnerUpdated(address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "PumpStation: Sadece Admin erisebilir");
        _;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "PumpStation: Sadece EntryPoint cagirabilir");
        _;
    }

    constructor(address _entryPoint, address _priceSigner) {
        require(_entryPoint != address(0), "PumpStation: zero entryPoint");
        owner = msg.sender;
        entryPoint = _entryPoint;
        priceSigner = _priceSigner;
    }

    function setPriceSigner(address _priceSigner) external onlyOwner {
        priceSigner = _priceSigner;
        emit PriceSignerUpdated(_priceSigner);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PumpStation: zero owner");
        owner = newOwner;
        emit OwnerUpdated(newOwner);
    }

    function adminAddNativeLiquidity() external payable onlyOwner {
        require(msg.value > 0, "PumpStation: zero amount");
        emit LiquidityAdded(address(0), msg.value);
    }

    function adminAddTokenLiquidity(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "PumpStation: native icin adminAddNativeLiquidity");
        require(amount > 0, "PumpStation: zero amount");
        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer basarisiz");
        emit LiquidityAdded(token, amount);
    }

    function adminWithdraw(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "PumpStation: zero amount");
        if (token == address(0)) {
            require(address(this).balance >= amount, "PumpStation: yetersiz ETH");
            (bool sent, ) = payable(owner).call{value: amount}("");
            require(sent, "PumpStation: ETH cekilemedi");
        } else {
            bool success = IERC20(token).transfer(owner, amount);
            require(success, "PumpStation: token cekilemedi");
        }
    }

    function depositToEntryPoint() external payable onlyOwner {
        IEntryPoint(entryPoint).depositTo{value: msg.value}(address(this));
    }

    function buyGasManuel(
        address tokenPaid,
        uint256 amountPaid,
        uint256 expectedGas,
        address recipient
    ) external {
        require(tokenPaid != address(0), "PumpStation: native odeme yok");
        require(recipient != address(0), "PumpStation: zero recipient");
        require(amountPaid > 0 && expectedGas > 0, "PumpStation: zero amount");

        bool success = IERC20(tokenPaid).transferFrom(msg.sender, address(this), amountPaid);
        require(success, "Odeme alinamadi");

        require(address(this).balance >= expectedGas, "Havuzda yeterli Gas yok");
        (bool sent, ) = payable(recipient).call{value: expectedGas}("");
        require(sent, "Gas transferi basarisiz");

        emit ManuelGasPurchased(recipient, tokenPaid, amountPaid, expectedGas);
    }

    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32,
        uint256 maxCost
    ) external view onlyEntryPoint returns (bytes memory context, uint256 validationData) {
        (
            address user,
            address tokenToPay,
            uint256 maxTokenCharge,
            uint256 deadline,
            uint256 quotedMaxNativeCost,
            bytes memory signature
        ) = _parsePaymasterData(userOp.paymasterAndData);

        if (user == address(0) || tokenToPay == address(0) || maxTokenCharge == 0) {
            return ("", 1);
        }

        if (block.timestamp > deadline) {
            return ("", 1);
        }

        uint256 nativeCap = quotedMaxNativeCost > 0 ? quotedMaxNativeCost : maxCost;
        if (nativeCap < maxCost) {
            return ("", 1);
        }

        if (priceSigner != address(0)) {
            if (!_verifyQuoteSignature(user, tokenToPay, maxTokenCharge, deadline, nativeCap, signature)) {
                return ("", 1);
            }
        }

        if (IERC20(tokenToPay).allowance(user, address(this)) < maxTokenCharge) {
            return ("", 1);
        }

        PaymasterContext memory ctx = PaymasterContext({
            user: user,
            tokenToPay: tokenToPay,
            maxTokenCharge: maxTokenCharge,
            maxNativeCost: nativeCap
        });

        return (abi.encode(ctx), 0);
    }

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256
    ) external onlyEntryPoint {
        if (mode != PostOpMode.opSucceeded) {
            return;
        }

        PaymasterContext memory ctx = abi.decode(context, (PaymasterContext));

        uint256 chargedAmount = _computeTokenCharge(
            actualGasCost,
            ctx.maxNativeCost,
            ctx.maxTokenCharge
        );

        bool success = IERC20(ctx.tokenToPay).transferFrom(ctx.user, address(this), chargedAmount);
        require(success, "Otomatik fee tahsil edilemedi");

        emit AutoGasPaid(ctx.user, actualGasCost, chargedAmount);
    }

    function _computeTokenCharge(
        uint256 actualGasCost,
        uint256 maxNativeCost,
        uint256 maxTokenCharge
    ) internal pure returns (uint256) {
        if (maxNativeCost == 0) {
            return maxTokenCharge;
        }
        uint256 proportional = (actualGasCost * maxTokenCharge) / maxNativeCost;
        uint256 withFee = (proportional * feeMultiplier) / bpsDivider;
        if (withFee > maxTokenCharge) {
            return maxTokenCharge;
        }
        if (withFee == 0 && actualGasCost > 0) {
            return 1;
        }
        return withFee;
    }

    function _verifyQuoteSignature(
        address user,
        address tokenToPay,
        uint256 maxTokenCharge,
        uint256 deadline,
        uint256 maxNativeCost,
        bytes memory signature
    ) internal view returns (bool) {
        if (signature.length != 65) {
            return false;
        }
        bytes32 structHash = keccak256(
            abi.encode(user, tokenToPay, maxTokenCharge, deadline, maxNativeCost, block.chainid, address(this))
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(structHash);
        address recovered = ECDSA.recover(digest, signature);
        return recovered == priceSigner;
    }

    function _parsePaymasterData(bytes calldata data)
        internal
        pure
        returns (
            address user,
            address tokenToPay,
            uint256 maxTokenCharge,
            uint256 deadline,
            uint256 maxNativeCost,
            bytes memory signature
        )
    {
        if (data.length < 20 + 32 * 5 + 65) {
            return (address(0), address(0), 0, 0, 0, "");
        }
        return abi.decode(data[20:], (address, address, uint256, uint256, uint256, bytes));
    }
}
