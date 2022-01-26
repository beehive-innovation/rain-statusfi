// SPDX-License-Identifier: CAL
pragma solidity ^0.8.10;

// solhint-disable-next-line max-line-length
import { ITier } from "@beehiveinnovation/rain-protocol/contracts/tier/ITier.sol";
// solhint-disable-next-line max-line-length
import { TierByConstruction } from "@beehiveinnovation/rain-protocol/contracts/tier/TierByConstruction.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";

contract GatedNFT is ERC721, TierByConstruction, Ownable {
    using Counters for Counters.Counter;

    struct Config {
        string name;
        string symbol;
        string description;
        string animationUrl;
        string imageUrl;
        bytes32 animationHash;
        bytes32 imageHash;
    }

    event CreatedGatedNFT(
        address contractAddress,
        address creator,
        Config config
    );

    Counters.Counter private _tokenIdCounter;

    Config private config;

    uint256 private minimumStatus;

    uint256 private maxPerAddress;

    bool private transferrable;

    uint256 private totalSupply;

    constructor (
        Config memory config_,
        ITier tier_,
        uint256 minimumStatus_,
        uint256 maxPerAddress_,
        bool transferrable_,
        uint256 totalSupply_
    ) ERC721(config_.name, config_.symbol) TierByConstruction(tier_) {
        config = config_;
        minimumStatus = minimumStatus_;
        maxPerAddress = maxPerAddress_;
        transferrable = transferrable_;
        totalSupply = totalSupply_;

        emit CreatedGatedNFT(
            address(this),
            msg.sender,
            config_
        );
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(tokenId), "Nonexistent token");
        // TODO: Return JSON object per
        // https://docs.opensea.io/docs/metadata-standards#metadata-structure
        return config.imageUrl;
    }

    function mint(address to) external returns (uint256) {
        require(isTier(to, minimumStatus), "Address missing required tier");
        require(
            balanceOf(to) < maxPerAddress,
            "Address has exhausted allowance"
        );
        uint256 tokenId = _tokenIdCounter.current();
        require(tokenId < totalSupply, "Total supply exhausted");
        _safeMint(to, tokenId);
        _tokenIdCounter.increment();
        return tokenId;
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) override internal virtual {
        require(transferrable, "Transfer not supported");
        require(
            balanceOf(to) < maxPerAddress,
            "Address has exhausted allowance"
        );
        // TODO: Check if recipient has required tier?
        super._transfer(from, to, tokenId);
    }
}
