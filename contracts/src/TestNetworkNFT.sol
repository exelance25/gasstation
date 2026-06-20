// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TestNetworkNFT
/// @author PumpStation
/// @notice ERC-721 test collection — mint payment goes to PUMPSTATION vault.
contract TestNetworkNFT is ERC721, Ownable, ReentrancyGuard {
    string public constant VAULT_LABEL = "PUMPSTATION";

    uint256 public immutable maxSupply;
    uint256 public immutable mintPrice;
    address payable private immutable _vault;
    string private _fixedTokenURI;
    uint256 private _nextTokenId;

    error MaxSupplyReached();
    error InsufficientPayment(uint256 sent, uint256 required);
    error TransferFailed();
    error ZeroTreasury();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory fixedTokenURI_,
        uint256 maxSupply_,
        uint256 mintPriceWei_,
        address treasury_
    ) ERC721(name_, symbol_) Ownable(treasury_ == address(0) ? msg.sender : treasury_) {
        require(maxSupply_ > 0, "TestNetworkNFT: zero supply");
        require(bytes(fixedTokenURI_).length > 0, "TestNetworkNFT: empty URI");
        if (treasury_ == address(0)) revert ZeroTreasury();
        _vault = payable(treasury_);
        _fixedTokenURI = fixedTokenURI_;
        maxSupply = maxSupply_;
        mintPrice = mintPriceWei_;
    }

    function vaultLabel() external pure returns (string memory) {
        return VAULT_LABEL;
    }

    function mint() external payable nonReentrant returns (uint256 tokenId) {
        tokenId = _nextTokenId;
        if (tokenId >= maxSupply) revert MaxSupplyReached();
        if (msg.value < mintPrice) revert InsufficientPayment(msg.value, mintPrice);

        unchecked {
            ++_nextTokenId;
        }

        (bool paid,) = _vault.call{value: mintPrice}("");
        if (!paid) revert TransferFailed();

        uint256 refund = msg.value - mintPrice;
        if (refund > 0) {
            (bool refunded,) = msg.sender.call{value: refund}("");
            if (!refunded) revert TransferFailed();
        }

        _safeMint(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _fixedTokenURI;
    }

    function withdraw() external onlyOwner nonReentrant {
        (bool ok,) = _vault.call{value: address(this).balance}("");
        if (!ok) revert TransferFailed();
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function remainingSupply() external view returns (uint256) {
        uint256 minted = _nextTokenId;
        return minted >= maxSupply ? 0 : maxSupply - minted;
    }
}
