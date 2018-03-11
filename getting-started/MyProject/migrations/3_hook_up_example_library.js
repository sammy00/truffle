// Note that artifacts.require takes care of creating an abstraction for us.
const SimpleNameRegistry = artifacts.require("example-truffle-library/SimpleNameRegistry");
const MyContract = artifacts.require("MyContract");

module.exports = async function (deployer) {
  // Deploy our contract, then set the address of the registry.
  const registry = await SimpleNameRegistry.deployed();
  //await deployer.deploy(MyContract);
  const mc = await MyContract.deployed();
  mc.setRegistry(registry.address);
};