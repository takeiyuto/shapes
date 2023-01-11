const ShapeContract = artifacts.require("Shapes");

module.exports = function (deployer) {
  deployer.deploy(ShapeContract);
};
