import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import type { Contract } from "ethers";
import type { GatedNFTFactory } from "../typechain/GatedNFTFactory";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { ReadWriteTier } from "../typechain/ReadWriteTier";
import { getEventArgs } from "./Util";

chai.use(solidity);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { expect, assert } = chai;

describe("GatedNFTFactory", async function () {
  let signers: SignerWithAddress[];
  let tier: ReadWriteTier & Contract;
  let gatedNFTFactory: GatedNFTFactory & Contract;

  beforeEach(async () => {
    signers = await ethers.getSigners();

    const tierFactory = await ethers.getContractFactory("ReadWriteTier");
    tier = (await tierFactory.deploy()) as ReadWriteTier & Contract;

    const gatedNFTFactoryFactory = await ethers.getContractFactory(
      "GatedNFTFactory"
    );
    gatedNFTFactory =
      (await gatedNFTFactoryFactory.deploy()) as GatedNFTFactory & Contract;
  });

  it("creates a child, sets the owner, and emits events", async () => {
    const createChildTypedTx = await gatedNFTFactory.createChildTyped(
      {
        name: "Test",
        symbol: "TEST",
        description: "Testing",
        animationUrl:
          "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        imageUrl:
          "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        animationHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        imageHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      tier.address,
      1,
      1,
      0,
      100,
      signers[9].address,
      1
    );

    const newChildEventArgs = await getEventArgs(
      createChildTypedTx,
      "NewChild",
      gatedNFTFactory
    );

    const gatedNFT = (await ethers.getContractFactory("GatedNFT")).attach(
      newChildEventArgs.child
    );

    const createdGatedNFTEventArgs = await getEventArgs(
      createChildTypedTx,
      "CreatedGatedNFT",
      gatedNFT
    );

    expect(createdGatedNFTEventArgs.contractAddress).to.eq(
      newChildEventArgs.child
    );
    expect(createdGatedNFTEventArgs.creator).to.eq(signers[0].address);
    expect(createdGatedNFTEventArgs.config.name).to.eq("Test");
    expect(createdGatedNFTEventArgs.config.symbol).to.eq("TEST");
    expect(createdGatedNFTEventArgs.config.description).to.eq("Testing");
    expect(createdGatedNFTEventArgs.config.animationUrl).to.eq(
      "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy"
    );
    expect(createdGatedNFTEventArgs.config.imageUrl).to.eq(
      "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy"
    );
    expect(createdGatedNFTEventArgs.config.animationHash).to.eq(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(createdGatedNFTEventArgs.config.imageHash).to.eq(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(createdGatedNFTEventArgs.tier).to.eq(tier.address);
    expect(createdGatedNFTEventArgs.minimumStatus).to.eq(1);
    expect(createdGatedNFTEventArgs.maxPerAddress).to.eq(1);
    expect(createdGatedNFTEventArgs.transferrable).to.eq(0);
    expect(createdGatedNFTEventArgs.maxMintable).to.eq(100);
    expect(createdGatedNFTEventArgs.royaltyRecipient).to.eq(signers[9].address);
    expect(createdGatedNFTEventArgs.royaltyBPS).to.eq(1);

    expect(await gatedNFT.owner()).to.eq(signers[0].address);
  });
});
