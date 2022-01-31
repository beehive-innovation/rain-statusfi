// SPDX-License-Identifier: CAL
pragma solidity ^0.8.10;

// solhint-disable-next-line max-line-length
import { ITier } from "@beehiveinnovation/rain-protocol/contracts/tier/ITier.sol";
// solhint-disable-next-line max-line-length
import { TierByConstruction } from "@beehiveinnovation/rain-protocol/contracts/tier/TierByConstruction.sol";
// solhint-disable-next-line max-line-length
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// solhint-disable-next-line max-line-length
import { ERC721Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
// solhint-disable-next-line max-line-length
import { CountersUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract GatedNFT is ERC721Upgradeable, TierByConstruction, OwnableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct Config {
        string name;
        string symbol;
        string description;
        string animationUrl;
        string imageUrl;
        bytes32 animationHash;
        bytes32 imageHash;
    }

    enum Transferrable {
        NonTransferrable,
        Transferrable,
        TierGatedTransferrable
    }

    CountersUpgradeable.Counter private tokenIdCounter;

    Config private config;

    uint256 private minimumStatus;

    uint256 private maxPerAddress;

    Transferrable private transferrable;

    uint256 private maxMintable;

    function initialize (
        address owner_,
        Config memory config_,
        ITier tier_,
        uint256 minimumStatus_,
        uint256 maxPerAddress_,
        Transferrable transferrable_,
        uint256 maxMintable_
    ) external initializer {
        __ERC721_init(config_.name, config_.symbol);
        __Ownable_init();
        initializeTierByConstruction(tier_);
        transferOwnership(owner_);
        config = config_;
        minimumStatus = minimumStatus_;
        maxPerAddress = maxPerAddress_;
        transferrable = transferrable_;
        maxMintable = maxMintable_;
        // Set tokenId to start at 1 instead of 0
        tokenIdCounter.increment();
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
        uint256 tokenId = tokenIdCounter.current();
        require(tokenId <= maxMintable, "Total supply exhausted");
        _safeMint(to, tokenId);
        tokenIdCounter.increment();
        return tokenId;
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) override internal virtual {
        require(
            transferrable != Transferrable.NonTransferrable,
            "Transfer not supported"
        );

        if (transferrable == Transferrable.TierGatedTransferrable) {
            require(
                isTier(to, minimumStatus),
                "Address missing required tier"
            );
        }

        require(
            balanceOf(to) < maxPerAddress,
            "Address has exhausted allowance"
        );

        super._transfer(from, to, tokenId);
    }

    /// @dev returns the number of minted tokens
    function totalSupply() external view returns (uint256) {
        return tokenIdCounter.current() - 1;
    }
}
