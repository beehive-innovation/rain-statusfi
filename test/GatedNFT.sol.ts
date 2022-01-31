import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import type { Contract } from "ethers";
import type { GatedNFT, ConfigStruct } from "../typechain/GatedNFT";
import type { GatedNFTFactory } from "../typechain/GatedNFTFactory";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { ReadWriteTier } from "../typechain/ReadWriteTier";

chai.use(solidity);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { expect, assert } = chai;

const deployGatedNFT = async (
  config: ConfigStruct,
  tierAddress: string,
  minimumStatus: number,
  maxPerAddress: number,
  transferrable: number,
  maxMintable: number,
  royaltyRecipient: string,
  royaltyBPS: number
): Promise<GatedNFT & Contract> => {
  const GatedNFTFactory = await ethers.getContractFactory("GatedNFTFactory");
  const gatedNFTFactory = (await GatedNFTFactory.deploy()) as GatedNFTFactory &
    Contract;
  const createChildTypedTx = await gatedNFTFactory.createChildTyped(
    config,
    tierAddress,
    minimumStatus,
    maxPerAddress,
    transferrable,
    maxMintable,
    royaltyRecipient,
    royaltyBPS
  );
  const createChildTypedReceipt = await createChildTypedTx.wait();
  const newChildEvent = createChildTypedReceipt.events.find(
    (event) => event.event === "NewChild"
  );
  return (await ethers.getContractAt(
    "GatedNFT",
    newChildEvent.args.child
  )) as GatedNFT & Contract;
};

describe("GatedNFT", async function () {
  let signers: SignerWithAddress[];
  let tier: ReadWriteTier & Contract;

  beforeEach(async () => {
    signers = await ethers.getSigners();

    const tierFactory = await ethers.getContractFactory("ReadWriteTier");
    tier = (await tierFactory.deploy()) as ReadWriteTier & Contract;
  });

  it("returns metadata when both URLs are specified", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = await deployGatedNFT(
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

    expect(await gatedNFT.name()).to.eq("Test");
    expect(await gatedNFT.symbol()).to.eq("TEST");
    await expect(gatedNFT.tokenURI(0)).to.be.revertedWith("Nonexistent token");

    await gatedNFT.mint(signers[1].address);

    const tokenURI = await gatedNFT.tokenURI(1);
    const metadata = JSON.parse(atob(tokenURI.split(',')[1]));

    expect(metadata).to.eql({
      name: 'Test',
      description: 'Testing',
      image: 'https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy',
      animation_url: 'https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy',
    });
  });

  it("returns metadata when only image URL is specified", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = await deployGatedNFT(
      {
        name: "Test",
        symbol: "TEST",
        description: "Testing",
        animationUrl:
          "",
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

    expect(await gatedNFT.name()).to.eq("Test");
    expect(await gatedNFT.symbol()).to.eq("TEST");
    await expect(gatedNFT.tokenURI(0)).to.be.revertedWith("Nonexistent token");

    await gatedNFT.mint(signers[1].address);

    const tokenURI = await gatedNFT.tokenURI(1);
    const metadata = JSON.parse(atob(tokenURI.split(',')[1]));

    expect(metadata).to.eql({
      name: 'Test',
      description: 'Testing',
      image: 'https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy',
    });
  });

  it("returns metadata when only animation URL is specified", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = await deployGatedNFT(
      {
        name: "Test",
        symbol: "TEST",
        description: "Testing",
        animationUrl:
          "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        imageUrl:
          "",
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

    expect(await gatedNFT.name()).to.eq("Test");
    expect(await gatedNFT.symbol()).to.eq("TEST");
    await expect(gatedNFT.tokenURI(0)).to.be.revertedWith("Nonexistent token");

    await gatedNFT.mint(signers[1].address);

    const tokenURI = await gatedNFT.tokenURI(1);
    const metadata = JSON.parse(atob(tokenURI.split(',')[1]));

    expect(metadata).to.eql({
      name: 'Test',
      description: 'Testing',
      animation_url: 'https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy',
    });
  });

  it("returns metadata when no URLs are specified", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = await deployGatedNFT(
      {
        name: "Test",
        symbol: "TEST",
        description: "Testing",
        animationUrl:
          "",
        imageUrl:
          "",
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

    expect(await gatedNFT.name()).to.eq("Test");
    expect(await gatedNFT.symbol()).to.eq("TEST");
    await expect(gatedNFT.tokenURI(0)).to.be.revertedWith("Nonexistent token");

    await gatedNFT.mint(signers[1].address);

    const tokenURI = await gatedNFT.tokenURI(1);
    const metadata = JSON.parse(atob(tokenURI.split(',')[1]));

    expect(metadata).to.eql({
      name: 'Test',
      description: 'Testing',
    });
  });

  it("returns the total supply", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = await deployGatedNFT(
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

    expect(await gatedNFT.totalSupply()).to.eq(0);

    await gatedNFT.mint(signers[1].address);

    expect(await gatedNFT.totalSupply()).to.eq(1);
  });

  it("gates minting based on tier", async () => {
    await tier.setTier(signers[2].address, 1, []);
    const gatedNFT = await deployGatedNFT(
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
    expect(transferEvent.args.tokenId).to.eq(1);
  });

  it("prevents minting to addresses that have exhausted their allowance", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = await deployGatedNFT(
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

    gatedNFT.mint(signers[1].address);

    await expect(gatedNFT.mint(signers[1].address)).to.be.revertedWith(
      "Address has exhausted allowance"
    );
  });

  it("prevents minting when the total supply is exhausted", async () => {
    await tier.setTier(signers[1].address, 1, []);
    await tier.setTier(signers[2].address, 1, []);
    const gatedNFT = await deployGatedNFT(
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
      1,
      signers[9].address,
      1
    );

    gatedNFT.mint(signers[1].address);

    await expect(gatedNFT.mint(signers[2].address)).to.be.revertedWith(
      "Total supply exhausted"
    );
  });

  it("prevents transfer when disabled", async () => {
    await tier.setTier(signers[1].address, 1, []);
    const gatedNFT = await deployGatedNFT(
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
    const gatedNFT = await deployGatedNFT(
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
      100,
      signers[9].address,
      1
    );

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
    const gatedNFT = await deployGatedNFT(
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
      100,
      signers[9].address,
      1
    );

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
    const gatedNFT = await deployGatedNFT(
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
      100,
      signers[9].address,
      1
    );

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

  it("returns royalty info", async () => {
    const gatedNFT = await deployGatedNFT(
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
      100,
      signers[9].address,
      200 // 2%
    );

    const royaltyInfo = await gatedNFT.royaltyInfo(0, ethers.utils.parseEther("1.0"));
    expect(royaltyInfo.receiver).to.eq(signers[9].address);
    expect(royaltyInfo.royaltyAmount).to.eq(ethers.utils.parseEther("0.02"));
  });
});
