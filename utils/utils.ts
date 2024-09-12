import { ethers } from "hardhat";

export const encoder = (types: string[], values: string[]) => {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodedParams = abiCoder.encode(types, values);

  return encodedParams.slice(2);
};

export const create2Address = (
  factoryAddress: string,
  saltHex: string,
  initCode: string
) => {
  const create2Addr = ethers.getCreate2Address(
    factoryAddress,
    saltHex,
    ethers.keccak256(initCode)
  );
  return create2Addr;
};

// exports.encoder = encoder;
// exports.create2Address = create2Address;
