import { createApp, reactive } from "vue";
import * as IpfsCore from "ipfs-core";
import Web3 from "web3";
import MetaMaskOnboarding from "@metamask/onboarding";
import * as metadata from "../../backend/metadata";
import { AbiItem } from "web3-utils";
import shapesJson from "../../blockchain/build/contracts/Shapes.json";
import { Shapes } from "./types/Shapes";

const abi = <AbiItem[]>shapesJson.abi;
const address = "0x...CONTRACT_ADDRESS...";

// @ts-ignore
const ethereum: any = window.ethereum;

const ipfs = IpfsCore.create({ start: false, preload: { enabled: false } });

let timer: any;
let web3: Web3 | null = null;
let shapes: Shapes | null = null;

function getChainName(chainId: number) {
    switch (chainId) {
    case 1: return "メインネット";
    case 5: return "Goerli";
    default: return "不明なネットワーク";
    }
}

const data = reactive({
    isConnectingWallet: false,
    chainId: 0,
    account: "",
    contractOwner: "",
    fgColor: 0,
    bgColor: 0,
    shape: 0,
    timestamp: 0,
    querying: false,
    isTokenRequested: false,
    isTokenIssued: false,
    nextPrice: "",
    cid: "",
    txErrorMessage: "",
    newPrice: <number | null>null,
    adminTxErrorMessage: "",
});

createApp({
    data: () => data,
    computed: {
        isWalletConnected() { return !!this.account; },
        isOwner() { return this.account == this.contractOwner; },
        chainName() { return getChainName(this.chainId); },
        fgColorText() { return metadata.Colors[this.fgColor]; },
        bgColorText() { return metadata.Colors[this.bgColor]; },
        shapeText() { return metadata.Shapes[this.shape]; },
        tokenId() { return metadata.getId(this.fgColor, this.bgColor, this.shape); },
        timestampText() { return new Date(this.timestamp * 1000)?.toISOString().substring(0, 19); },
        metadataJson() {
            const doc = document.implementation.createHTMLDocument();
            return metadata.generateMetadata(doc, this.tokenId, this.timestamp);
        },
        tokenMetadata() { return JSON.parse(this.metadataJson); },
        name() { return this.tokenMetadata?.name; },
        description() { return this.tokenMetadata?.description; },
        svg() { return this.tokenMetadata?.image_data; },
        nextPriceText() { return !this.nextPrice ? "" : Web3.utils.fromWei(this.nextPrice); },
        isOnSale() { return !!this.nextPrice; },
    },
    watch: {
        tokenId: {
            handler() {
                this.setQueryTimer();
                this.timestamp = Math.round(Date.now() / 1000);
            },
            immediate: true,
        },
        metadataJson: {
            async handler() {
                this.cid = await metadata.getCid(await ipfs, this.metadataJson);
            },
            immediate: true,
        }
    },
    created() {
        this.contractAddress = address;
    },
    mounted() {
        if (MetaMaskOnboarding.isMetaMaskInstalled()) {
            ethereum.on("accountsChanged", (newAccounts: string[]) => {
                this.changeAccounts(newAccounts);
            });
            ethereum.on("chainChanged", (newChainId: string) => {
                this.chainId = Web3.utils.hexToNumber(newChainId);
            });
        }
    },
    methods: {
        async connectWallet() {
            if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
                (new MetaMaskOnboarding()).startOnboarding();
                return;
            }

            this.isConnectingWallet = true;
            try {
                web3 = new Web3(ethereum);
                const accounts = await web3.eth.requestAccounts();
                web3.eth.subscribe("newBlockHeaders", this.loadContractInfo);
                this.chainId = await web3.eth.getChainId();
                this.changeAccounts(accounts);

                shapes = <Shapes><any>new web3.eth.Contract(abi, address);
                this.loadContractInfo();
            } catch (e) {
                // 接続がキャンセルされた状態。
                this.disconnectWallet();
            } finally {
                this.isConnectingWallet = false;
            }
        },
        changeAccounts(accounts: string[]) {
            if (!accounts || accounts.length == 0) {
                this.disconnectWallet();
            } else {
                this.account = accounts[0].toLowerCase();
            }
        },
        disconnectWallet() {
            web3?.eth.clearSubscriptions(undefined as any);
            web3 = null;
            shapes = null;
            clearTimeout(timer);
            this.account = "";
            this.contractOwner = "";
            this.txErrorMessage = "";
            this.querying = false;
            this.nextPrice = "";
            this.adminTxErrorMessage = "";
        },
        async loadContractInfo() {
            this.contractOwner = (await shapes!.methods.owner().call()).toLowerCase();
            try {
                this.nextPrice = await shapes!.methods.getPrice().call();
            } catch {
                this.nextPrice = "";
            }

            await this.queryMetadata();
        },
        setQueryTimer() {
            this.querying = true;
            clearTimeout(timer);
            timer = setTimeout(this.queryMetadata, 500);
        },
        async queryMetadata() {
            clearTimeout(timer);

            this.isTokenRequested = false;
            this.isTokenIssued = false;
            if (this.isWalletConnected) {
                if (await shapes!.methods.requested(this.tokenId).call()) {
                    this.isTokenRequested = true;
                } else if (await shapes!.methods.exists(this.tokenId).call()) {
                    this.isTokenIssued = true;
                }
            }
            this.querying = false;
        },
        async purchaseToken() {
            this.txErrorMessage = "";
            try {
                await shapes!.methods.requestMint(this.tokenId, this.timestamp, this.cid).send({
                    from: this.account,
                    value: this.nextPrice,
                });
            } catch (e: any) {
                this.txErrorMessage = e.message;
            }
        },
        async openSale() {
            this.adminTxErrorMessage = "";
            try {
                const newPriceMilliEther = Math.round(this.newPrice * 1000);
                await shapes!.methods.openSale(newPriceMilliEther).send({ from: this.account });
            } catch (e: any) {
                this.adminTxErrorMessage = e.message;
            }
        },
        async closeSale() {
            this.adminTxErrorMessage = "";
            try {
                await shapes!.methods.closeSale().send({ from: this.account });
            } catch (e: any) {
                this.adminTxErrorMessage = e.message;
            }
        },
    },
}).mount("#app");
