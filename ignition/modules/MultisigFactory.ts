import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { bytecode } from "../../artifacts/contracts/Multisig.sol/Multisig.json";
import { encoder, create2Address } from "../../utils/utils";

const MultisigFactory = buildModule("MultisigFactoryModule", (m) => {
  const multisigFactory = m.contract("MultisigFactory", []);

  return { multisigFactory };
});

export default MultisigFactory;
