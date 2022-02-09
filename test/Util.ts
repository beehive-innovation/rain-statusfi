import type { Contract, ContractTransaction } from "ethers";
import { Result } from "ethers/lib/utils";

export const getEventArgs = async (
  tx: ContractTransaction,
  eventName: string,
  contract: Contract,
  contractAddressOverride: string = null
): Promise<Result> => {
  const eventObj = (await tx.wait()).events.find(
    (x) =>
      x.topics[0] == contract.filters[eventName]().topics[0] &&
      x.address ==
        (contractAddressOverride ? contractAddressOverride : contract.address)
  );

  if (!eventObj) {
    throw new Error(`Could not find event with name ${eventName}`);
  }

  return contract.interface.decodeEventLog(eventName, eventObj.data);
};
