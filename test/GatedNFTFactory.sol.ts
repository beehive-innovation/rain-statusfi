import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import type { Contract } from "ethers";
import type { GatedNFTFactory } from "../typechain/GatedNFTFactory";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { ReadWriteTier } from "../typechain/ReadWriteTier";

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
      100
    );
    const createChildTypedReceipt = await createChildTypedTx.wait();
    const newChildEvent = createChildTypedReceipt.events.find(
      (event) => event.event === "NewChild"
    );
    const createdGatedNFTEvent = createChildTypedReceipt.events.find(
      (event) => event.event === "CreatedGatedNFT"
    );

    expect(newChildEvent).to.not.be.empty;
    expect(createdGatedNFTEvent).to.not.be.empty;
    expect(createdGatedNFTEvent.args.contractAddress).to.eq(
      newChildEvent.args.child
    );
    expect(createdGatedNFTEvent.args.creator).to.eq(signers[0].address);
    expect(createdGatedNFTEvent.args.config.name).to.eq("Test");
    expect(createdGatedNFTEvent.args.config.symbol).to.eq("TEST");
    expect(createdGatedNFTEvent.args.config.description).to.eq("Testing");
    expect(createdGatedNFTEvent.args.config.animationUrl).to.eq(
      "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy"
    );
    expect(createdGatedNFTEvent.args.config.imageUrl).to.eq(
      "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy"
    );
    expect(createdGatedNFTEvent.args.config.animationHash).to.eq(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(createdGatedNFTEvent.args.config.imageHash).to.eq(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );

    const GatedNFT = await ethers.getContractFactory("GatedNFT");
    const gatedNFT = GatedNFT.attach(newChildEvent.args.child);

    expect(await gatedNFT.owner()).to.eq(signers[0].address);
  });
});
