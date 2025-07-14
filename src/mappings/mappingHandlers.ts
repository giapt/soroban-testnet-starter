import { TeamFinanceToken } from "../types";
import {
  StellarOperation,
  StellarEffect,
  SorobanEvent,
} from "@subql/types-stellar";
import {
  AccountCredited,
  AccountDebited,
} from "@stellar/stellar-sdk/lib/horizon/types/effects";
import { Horizon, xdr, scValToNative } from "@stellar/stellar-sdk";
import { Address } from "@stellar/stellar-base";
import initWasm, { decode } from '@stellar/stellar-xdr-json/stellar_xdr_json.js';
import fetch from "node-fetch";


import { getName } from "./utils";

// export async function handleOperation(
//   op: StellarOperation<Horizon.HorizonApi.PaymentOperationResponse>,
// ): Promise<void> {
//   logger.info(`Indexing operation ${op.id}, type: ${op.type}`);

//   const fromAccount = await checkAndGetAccount(op.from, op.ledger!.sequence);
//   const toAccount = await checkAndGetAccount(op.to, op.ledger!.sequence);

//   const payment = Payment.create({
//     id: op.id,
//     fromId: fromAccount.id,
//     toId: toAccount.id,
//     txHash: op.transaction_hash,
//     amount: op.amount,
//   });

//   fromAccount.lastSeenLedger = op.ledger!.sequence;
//   toAccount.lastSeenLedger = op.ledger!.sequence;
//   await Promise.all([fromAccount.save(), toAccount.save(), payment.save()]);
// }

// export async function handleCredit(
//   effect: StellarEffect<AccountCredited>,
// ): Promise<void> {
//   logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`);

//   const account = await checkAndGetAccount(
//     effect.account,
//     effect.ledger!.sequence,
//   );

//   const credit = Credit.create({
//     id: effect.id,
//     accountId: account.id,
//     amount: effect.amount,
//   });

//   account.lastSeenLedger = effect.ledger!.sequence;
//   await Promise.all([account.save(), credit.save()]);
// }

// export async function handleDebit(
//   effect: StellarEffect<AccountDebited>,
// ): Promise<void> {
//   logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`);

//   const account = await checkAndGetAccount(
//     effect.account,
//     effect.ledger!.sequence,
//   );

//   const debit = Debit.create({
//     id: effect.id,
//     accountId: account.id,
//     amount: effect.amount,
//   });

//   account.lastSeenLedger = effect.ledger!.sequence;
//   await Promise.all([account.save(), debit.save()]);
// }

export async function handleTransferEvent(event: SorobanEvent): Promise<void> {
  logger.info(
    `New transfer event found at block ${event.ledger!.sequence.toString()}`,
  );

  try {
    // const httpData = await fetch("https://api.github.com/users/github");
    const response = await fetch('https://api.github.com/users/github');
    const data = await response.json();
    logger.info(`httpData: ${JSON.stringify(data)}`);
  } catch (error) {
    logger.error(`Error fetching data: ${error}`);
  }

  // Get data from the event
  // The transfer event has the following payload \[env, from, to\]
  // logger.info(JSON.stringify(event));
  const {
    topic: [env, from, to],
  } = event;

  try {
    decodeAddress(from);
    decodeAddress(to);
  } catch (e) {
    logger.info(`decode address failed`);
  }

  // const fromAccount = await checkAndGetAccount(
  //   decodeAddress(from),
  //   event.ledger!.sequence,
  // );
  // const toAccount = await checkAndGetAccount(
  //   decodeAddress(to),
  //   event.ledger!.sequence,
  // );

  // logger.info(`From Account: ${fromAccount.id}`);
  // logger.info(`To Account: ${toAccount.id}`);

  // // Create the new transfer entity
  // const transfer = Transfer.create({
  //   id: event.id,
  //   ledger: event.ledger!.sequence,
  //   date: new Date(event.ledgerClosedAt),
  //   contract: event.contractId?.contractId().toString()!,
  //   fromId: fromAccount.id,
  //   toId: toAccount.id,
  //   value: BigInt(event.value.i64().toString()),
  // });

  // fromAccount.lastSeenLedger = event.ledger!.sequence;
  // toAccount.lastSeenLedger = event.ledger!.sequence;
  // await Promise.all([fromAccount.save(), toAccount.save(), transfer.save()]);
}

export async function handleMintEvent(event: SorobanEvent): Promise<void> {

  logger.info(
    `New mint event found at block ${event.ledger!.sequence.toString()}`,
  );

  // logger.info(`Event info: ${JSON.stringify(event)}`);


  // Get data from the event
  // The transfer event has the following payload \[env, from, to\]
  logger.info(`Event ID: ${event.id}`);
  const xdrString = JSON.stringify(event.transaction?.envelope_xdr);
  const xdrType = "TransactionEnvelope"; // Or other XDR type
  
  // logger.info(`Owner: ${owner}`);
  logger.info(`contractId: ${event.contractId?.contractId().toString()}`);
  const contractAddress = event.contractId?.contractId().toString() || "unknown";

  // const name = await getName(contractAddress);
  // logger.info(`Contract Name: ${name}`);
  // logger.info(`Date: ${Date.parse(event.ledgerClosedAt)}`);

  const token = TeamFinanceToken.create({
    id: event.id,
    blockHeight: event.ledger!.sequence,
    txHash: event.transaction?.hash,
    sequence: event.ledger!.sequence,
    envelopeXdr: event.transaction?.envelope_xdr,
    address: contractAddress,
    owner: scValToNative(event.value), // Assuming value is the owner address
    timestamp: BigInt(Date.parse(event.ledgerClosedAt)),
    // contract: event.contractId?.contractId().toString()!,
    // owner: owner,
  });
  await Promise.all([token.save()]);

  // try {
  //   const keyFilePath = path.join(__dirname, "../src/mappings/stellar_xdr_json_bg.wasm");
  //   logger.info(`keyFilePath: ${keyFilePath}`);
  //   const exists = await fileExists(keyFilePath);
  //   logger.info(`WASM file exists: ${exists}`);
  //   const wasmBinary = await fs.readFile(keyFilePath);
  //   if (Buffer.isBuffer(wasmBinary)) {
  //     logger.info(`WASM file read successfully, size: ${wasmBinary.length} bytes`);
  //   } else {
  //     logger.error(`WASM file read failed, data is not a buffer`);
  //   }
  //   const wasmBytes = new Uint8Array(wasmBinary);
  //   await initWasm(wasmBytes);
  // const decoded = decode(xdrType, xdrString);
  // const data = JSON.parse(decoded);
  // logger.info(`Decoded XDR: ${JSON.stringify(data, null, 2)}`);
  // } catch (error) {
  //   logger.error(`Error reading or initializing WASM: ${error}`);
  // }
  // const keyFilePath = path.join(__dirname, "../stellar_xdr_json_bg.wasm");
  // const wasmBinary = await fs.readFile(keyFilePath);

  // try {
  //   // const httpData = await fetch("https://api.github.com/users/github");
  //   const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  //   const data = await response.json();
  //   logger.info(`httpData: ${JSON.stringify(data)}`);
  // } catch (error) {
  //   logger.error(`Error fetching data: ${error}`);
  // }
  
}

// async function checkAndGetAccount(
//   id: string,
//   ledgerSequence: number,
// ): Promise<Account> {
//   let account = await Account.get(id.toLowerCase());
//   if (!account) {
//     // We couldn't find the account
//     account = Account.create({
//       id: id.toLowerCase(),
//       firstSeenLedger: ledgerSequence,
//     });
//   }
//   return account;
// }

// scValToNative not works, temp solution
function decodeAddress(scVal: xdr.ScVal): string {
  try {
    return Address.account(scVal.address().accountId().ed25519()).toString();
  } catch (e) {
    return Address.contract(scVal.address().contractId()).toString();
  }
}
