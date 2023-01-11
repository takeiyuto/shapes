import * as metadata from "./metadata.js";
import * as IpfsCore from "ipfs-core";
import { JSDOM } from "jsdom";
import Web3 from "web3";
import { Shapes } from "./types/Shapes";
import fs from "fs";
import { NonPayableTransactionObject } from "./types/types.js";

const address = "0x...CONTRACT_ADDRESS...";
const wsUrl = "ws://127.0.0.1:8545/";

const web3 = new Web3(new Web3.providers.WebsocketProvider(wsUrl));
const myAccount = (() => {
    const privateKey = fs.readFileSync(".secret").toString().trim();
    return web3.eth.accounts.privateKeyToAccount(privateKey);
})();

const shapesJson = JSON.parse(fs.readFileSync("../blockchain/build/contracts/Shapes.json").toString());
// @ts-ignore 型定義と厳密には一致しない
const contract: Shapes = new web3.eth.Contract(shapesJson.abi, address);

const ipfs = await IpfsCore.create();

contract.events.MintRequested(async (error, result) => {
    if (error) {
        console.error(`エラー (${error}) が発生しました。終了します。`);
        process.exit(1);
        return;
    }

    const tokenId = web3.utils.toNumber(result.returnValues.tokenId);
    console.info(`新たに ${tokenId} の発行リクエストを受け取りました。`);
    await processRequest(tokenId);
});

async function processRequest(tokenId: number) {
    const request = await contract.methods.mintRequests(tokenId).call();
    const expectedCid = await addMetadata(tokenId, web3.utils.toNumber(request.timestamp));

    // トランザクションを送信する。
    if (expectedCid != request.cid) {
        console.info(`${tokenId} のリクエストは、要求 CID: ${request.cid} と想定 CID ${expectedCid} の不一致で却下します。`);
        sendTransaction(contract.methods.rejectRequest(tokenId));
    } else {
        console.info(`${tokenId} のリクエストは、CID: ${request.cid} で承認します。`);
        sendTransaction(contract.methods.approveRequest(tokenId));

        await ipfs.pin.add(expectedCid);
        console.info(`ID: ${tokenId} のトークンのメタデータを IPFS: ${expectedCid} で登録しました。`);
    }
}

async function sendTransaction(tx: NonPayableTransactionObject<void>) {
    const estimatedGas = await tx.estimateGas({ from: myAccount.address });
    await tx.send({ from: myAccount.address, gas: estimatedGas });
}

function addMetadata(tokenId: number, timestamp: number) {
    const tempDoc = (new JSDOM("")).window.document;
    const generated = metadata.generateMetadata(tempDoc, tokenId, timestamp);
    return metadata.getCid(ipfs, generated);
}

for (let tokenId = 1; tokenId <= 1024; tokenId++) {
    if (await contract.methods.requested(tokenId).call()) {
        console.info(`${tokenId} がリクエストされています。`);
        await processRequest(tokenId);
    } else if (await contract.methods.exists(tokenId).call()) {
        const timestampText = await contract.methods.getTimestampForToken(tokenId).call();
        const cid = await addMetadata(tokenId, web3.utils.toNumber(timestampText));
        console.info(`${tokenId} はすでに発行されています。CID: ${cid} でピンします。`);
        ipfs.pin.add(cid);
    }
}

console.info(`アドレス ${myAccount.address} で起動しました。`);
