// SPDX-License-Identifier: CAL
pragma solidity ^0.8.10;

import { GatedNFT } from "./GatedNFT.sol";
// solhint-disable-next-line max-line-length
import { Factory } from "@beehiveinnovation/rain-protocol/contracts/factory/Factory.sol";
// solhint-disable-next-line max-line-length
import { ITier } from "@beehiveinnovation/rain-protocol/contracts/tier/ITier.sol";
import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";

contract GatedNFTFactory is Factory {
    event CreatedGatedNFT(
        address contractAddress,
        address creator,
        GatedNFT.Config config
    );

    address private immutable implementation;

    constructor() {
        address implementation_ = address(new GatedNFT());
        emit Implementation(msg.sender, implementation_);
        implementation = implementation_;
    }

    function createChildTyped(
        GatedNFT.Config memory config_,
        ITier tier_,
        uint256 minimumStatus_,
        uint256 maxPerAddress_,
        GatedNFT.Transferrable transferrable_,
        uint256 maxMintable_
    ) external returns (GatedNFT) {
        GatedNFT gatedNFT = GatedNFT(
            this.createChild(
                abi.encode(
                    msg.sender,
                    config_,
                    tier_,
                    minimumStatus_,
                    maxPerAddress_,
                    transferrable_,
                    maxMintable_
                )
            )
        );

        emit CreatedGatedNFT(
            address(gatedNFT),
            msg.sender,
            config_
        );

        return gatedNFT;
    }

    function _createChild(bytes calldata data_)
        internal
        virtual
        override
        returns (address)
    {
        (
            address owner_,
            GatedNFT.Config memory config_,
            ITier tier_,
            uint256 minimumStatus_,
            uint256 maxPerAddress_,
            GatedNFT.Transferrable transferrable_,
            uint256 maxMintable_
        ) = abi.decode(
            data_,
            (
                address,
                GatedNFT.Config,
                ITier,
                uint256,
                uint256,
                GatedNFT.Transferrable,
                uint256
            )
        );

        address clone_ = Clones.clone(implementation);

        GatedNFT(clone_).initialize(
            owner_,
            config_,
            tier_,
            minimumStatus_,
            maxPerAddress_,
            transferrable_,
            maxMintable_
        );

        return clone_;
    }
}
