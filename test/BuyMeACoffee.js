const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("BuyMeACoffee", function () {
  async function deploymentFixture() {
    // Contracts are deployed using the first signer/account by default
    const provider = await ethers.provider;
    const [owner, addr1] = await ethers.getSigners();

    const BuyMeACoffee = await ethers.getContractFactory("BuyMeACoffee");
    const buyMeACoffee = await BuyMeACoffee.deploy();

    return { provider, owner, addr1, buyMeACoffee };
  }

  describe("Deployment", function () {
    it("Should set the right recipient", async function () {
      const { buyMeACoffee, owner } = await loadFixture(deploymentFixture);

      expect(await buyMeACoffee.recipient()).to.equal(owner.address);
    });
  });

  describe("Buy Coffee", function () {
    it("Should be able to receive coffee by himself", async function () {
      const { provider, buyMeACoffee } = await loadFixture(deploymentFixture);

      let amount = ethers.utils.parseEther("0.1");
      await buyMeACoffee.buyCoffee("John Doe", "Sent you a coffee!", { value: amount });

      expect(await provider.getBalance(buyMeACoffee.address)).to.equal(amount);
    });

    it("Should be able to receive coffee by others", async function () {
      const { provider, buyMeACoffee, addr1 } = await loadFixture(deploymentFixture);

      let amount = ethers.utils.parseEther("0.1");
      await buyMeACoffee.connect(addr1).buyCoffee("Addr 1", "Sent you a coffee!", { value: amount });

      expect(await provider.getBalance(buyMeACoffee.address)).to.equal(amount);
    });

    it("Should be able to receive the memo", async function () {
      const { provider, buyMeACoffee } = await loadFixture(deploymentFixture);

      let amount = ethers.utils.parseEther("0.1");

      let name = "John Doe";
      let message = "Sent you a coffee!";
      await buyMeACoffee.buyCoffee(name, message, { value: amount });

      let memos = await buyMeACoffee.memos();

      expect(memos.length).to.equal(1);
    });

    it("Should be able to receive the memo with correct name and message", async function () {
      const { provider, buyMeACoffee } = await loadFixture(deploymentFixture);

      let amount = ethers.utils.parseEther("0.1");

      let name = "John Doe";
      let message = "Sent you a coffee!";
      await buyMeACoffee.buyCoffee(name, message, { value: amount });

      let memos = await buyMeACoffee.memos();

      expect(memos[0].name).to.equal(name);
      expect(memos[0].message).to.equal(message);
    });

    it("Should be able to withdraw by recipient", async function () {
      const { provider, buyMeACoffee, owner } = await loadFixture(deploymentFixture);

      let amount = ethers.utils.parseEther("0.1");
      await buyMeACoffee.buyCoffee("John Doe", "Sent you a coffee!", { value: amount });

      let currentBalance = await owner.getBalance();

      // 1. let's do a withdrawal
      const tx = await buyMeACoffee.withdraw();

      // 2. Let's calculate the gas spent
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      expect(await owner.getBalance()).to.equal(currentBalance.add(amount.sub(gasSpent)));
    });

    it("Should not be able to withdraw by others", async function () {
      const { provider, buyMeACoffee, addr1 } = await loadFixture(deploymentFixture);

      let amount = ethers.utils.parseEther("0.1");
      await buyMeACoffee.buyCoffee("Addr 1", "Sent you a coffee!", { value: amount });

      expect(await buyMeACoffee.connect(addr1).withdraw()).to.reverted;
    });

    it("Should be able to update the recipient", async function () {
      const { provider, buyMeACoffee, addr1 } = await loadFixture(deploymentFixture);

      await buyMeACoffee.connect(addr1).setMyselfAsRecipient();

      expect(await buyMeACoffee.recipient()).to.equal(addr1.address);
    });

    it("Should withdraw first before updating the recipient", async function () {
      const { provider, buyMeACoffee, owner, addr1 } = await loadFixture(deploymentFixture);

      let amount = ethers.utils.parseEther("0.1");
      await buyMeACoffee.buyCoffee("John Doe", "Sent you a coffee!", { value: amount });

      let currentBalance = await owner.getBalance();

      // update the recipient by others
      await buyMeACoffee.connect(addr1).withdraw();

      expect(await owner.getBalance()).to.equal(currentBalance.add(amount));
    });
  });
});
