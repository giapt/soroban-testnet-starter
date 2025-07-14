import {
    Keypair,
    rpc as StellarRpc,
    scValToNative,
    TransactionBuilder,
    BASE_FEE,
    Networks,
    Operation,
  } from "@stellar/stellar-sdk";
const rpc_url = "https://soroban-testnet.stellar.org:443";
export async function getName(
    contractId: string,
): Promise<string> {
  let name = "unknown";
    try {
      const RpcServer = new StellarRpc.Server(rpc_url, { allowHttp: true });
  
    // Load the account (getting the sequence number for the account and making an account object.)
    const account = await RpcServer.getAccount("GDJWQT5XHCCITZXTGE6U3D7ELLGKHLAKJRCO2NRIIOIPZYHHBWSZBYEW");
    
    // Define the transaction
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
    })
      .setNetworkPassphrase(Networks.TESTNET) 
      .setTimeout(30)
      .addOperation(
        Operation.invokeContractFunction({
          function: "symbol",
          // the contract function and address need to be set by you.
          contract: contractId,
          args: [],
        }),
      )
      .build();
    
      const sim = await RpcServer.simulateTransaction(transaction);
    
      
  if ('result' in sim && sim.result) {
    // console.log("result:", sim.result);
    // console.log("humanReadable Result:", scValToNative(sim?.result?.retval));
    name = scValToNative(sim.result.retval);
  }
    } catch (error) {
      logger.error(`Error getting name for contract ${contractId}: ${error}`);
    }
    
  return name;
}