import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import type { Contract, ContractFactory } from "ethers";
import type { GatedNFT } from "../typechain/GatedNFT";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { ReadWriteTier } from "../typechain/ReadWriteTier";

chai.use(solidity);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { expect, assert } = chai;

describe("GatedNFT", async function () {
  let signers: SignerWithAddress[];
  let tier: ReadWriteTier & Contract;
  let gatedNFTFactory: ContractFactory;

  beforeEach(async () => {
    signers = await ethers.getSigners();

    const tierFactory = await ethers.getContractFactory("ReadWriteTier");
    tier = (await tierFactory.deploy()) as ReadWriteTier & Contract;

    gatedNFTFactory = await ethers.getContractFactory("GatedNFT");
  });

  it("emits an event on deploy", async () => {
    const gatedNFT = (await gatedNFTFactory.deploy(
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
    )) as GatedNFT & Contract;

    const deployTransactionReceipt = await gatedNFT.deployTransaction.wait();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const createdGatedNFTEvent = deployTransactionReceipt.events.find(
      (event) => event.event === "CreatedGatedNFT"
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
  });

  it("returns metadata", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = (await gatedNFTFactory.deploy(
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
    )) as GatedNFT & Contract;

    expect(await gatedNFT.name()).to.eq("Test");
    expect(await gatedNFT.symbol()).to.eq("TEST");
    await expect(gatedNFT.tokenURI(0)).to.be.revertedWith("Nonexistent token");

    await gatedNFT.mint(signers[1].address);

    expect(await gatedNFT.tokenURI(0)).to.eq(
      "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy"
    );
  });

  it("gates minting based on tier", async () => {
    await tier.setTier(signers[2].address, 1, []);
    const gatedNFT = (await gatedNFTFactory.deploy(
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
    )) as GatedNFT & Contract;

    await expect(gatedNFT.mint(signers[1].address)).to.be.revertedWith(
      "Address missing required tier"
    );

    const mintTx = await gatedNFT.mint(signers[2].address);
    const mintReceipt = await mintTx.wait();
    const transferEvent = mintReceipt.events.find(
      (event) => event.event === "Transfer"
    );

    expect(transferEvent.args.from).to.eq(
      "0x0000000000000000000000000000000000000000"
    );
    expect(transferEvent.args.to).to.eq(signers[2].address);
    expect(transferEvent.args.tokenId).to.eq(0);
  });

  it("prevents minting to addresses that have exhausted their allowance", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = (await gatedNFTFactory.deploy(
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
    )) as GatedNFT & Contract;

    gatedNFT.mint(signers[1].address);

    await expect(gatedNFT.mint(signers[1].address)).to.be.revertedWith(
      "Address has exhausted allowance"
    );
  });

  it("prevents minting when the total supply is exhausted", async () => {
    await tier.setTier(signers[1].address, 1, []);
    await tier.setTier(signers[2].address, 1, []);
    const gatedNFT = (await gatedNFTFactory.deploy(
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
      1
    )) as GatedNFT & Contract;

    gatedNFT.mint(signers[1].address);

    await expect(gatedNFT.mint(signers[2].address)).to.be.revertedWith(
      "Total supply exhausted"
    );
  });

  it("prevents transfer when disabled", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = (await gatedNFTFactory.deploy(
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
    )) as GatedNFT & Contract;

    const mintTx = await gatedNFT.mint(signers[1].address);
    const mintReceipt = await mintTx.wait();
    const transferEvent = mintReceipt.events.find(
      (event) => event.event === "Transfer"
    );
    const tokenId = transferEvent.args.tokenId;

    await expect(
      gatedNFT
        .connect(signers[1])
        .transferFrom(signers[1].address, signers[2].address, tokenId)
    ).to.be.revertedWith("Transfer not supported");
  });

  it("prevents transferring to addresses that don't meet the tier when tier gated transfer enabled", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = (await gatedNFTFactory.deploy(
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
      2,
      100
    )) as GatedNFT & Contract;

    const mintTx = await gatedNFT.mint(signers[1].address);
    const mintReceipt = await mintTx.wait();
    const transferEvent = mintReceipt.events.find(
      (event) => event.event === "Transfer"
    );
    const tokenId = transferEvent.args.tokenId;

    await expect(
      gatedNFT
        .connect(signers[1])
        .transferFrom(signers[1].address, signers[2].address, tokenId)
    ).to.be.revertedWith("Address missing required tier");
  });

  it("prevents transferring to addresses that have exhausted their allowance", async () => {
    await tier.setTier(signers[1].address, 1, []);
    await tier.setTier(signers[2].address, 1, []);
    const gatedNFT = (await gatedNFTFactory.deploy(
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
      2,
      100
    )) as GatedNFT & Contract;

    await gatedNFT.mint(signers[1].address);

    const mintTx = await gatedNFT.mint(signers[2].address);
    const mintReceipt = await mintTx.wait();
    const transferEvent = mintReceipt.events.find(
      (event) => event.event === "Transfer"
    );
    const tokenId = transferEvent.args.tokenId;

    await expect(
      gatedNFT
        .connect(signers[2])
        .transferFrom(signers[2].address, signers[1].address, tokenId)
    ).to.be.revertedWith("Address has exhausted allowance");
  });

  it("allows transferring when all criteria are met", async () => {
    await tier.setTier(signers[1].address, 1, []);
    await tier.setTier(signers[2].address, 1, []);
    const gatedNFT = (await gatedNFTFactory.deploy(
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
      2,
      100
    )) as GatedNFT & Contract;

    const mintTx = await gatedNFT.mint(signers[1].address);
    const mintReceipt = await mintTx.wait();
    const mintEvent = mintReceipt.events.find(
      (event) => event.event === "Transfer"
    );
    const tokenId = mintEvent.args.tokenId;

    const transferTx = await gatedNFT
      .connect(signers[1])
      .transferFrom(signers[1].address, signers[2].address, tokenId);
    const transferReceipt = await transferTx.wait();
    const transferEvent = transferReceipt.events.find(
      (event) => event.event === "Transfer"
    );

    expect(transferEvent.args.from).to.eq(signers[1].address);
    expect(transferEvent.args.to).to.eq(signers[2].address);
    expect(transferEvent.args.tokenId).to.eq(tokenId);
  });
});
