import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
} from '@ton/core';

export type JettonMinterConfig = {
    // TotalSupply: bigint;
    Admin: Address;
    Content: Cell;
    WalletCode: Cell;
};

export abstract class Op {
    static transfer = 0xf8a7ea5;
    static transfer_notification = 0x7362d09c;
    static internal_transfer = 0x178d4519;
    static excesses = 0xd53276db;
    static burn = 0x595f07bc;
    static burn_notification = 0x7bdd97de;

    static provide_wallet_address = 0x2c76b973;
    static take_wallet_address = 0xd1735400;
    static mint = 21;
    static change_admin = 3;
    static change_content = 4;
}

export function jettonMinterConfigToCell(config: JettonMinterConfig): Cell {
    return beginCell()
        .storeCoins(0)
        .storeAddress(config.Admin)
        .storeRef(config.Content)
        .storeRef(config.WalletCode)
        .endCell();
}

export class JettonMinter implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new JettonMinter(address);
    }

    static createFromConfig(config: JettonMinterConfig, code: Cell, workchain = 0) {
        const data = jettonMinterConfigToCell(config);
        const init = { code, data };
        return new JettonMinter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    // 依据funC代码中，接收mint消息时，组装in_msg_body结构
    static mintMessage(
        from: Address,
        to: Address,
        jettonAmount: bigint,
        forwardTonAmount: bigint,
        totalTonAmount: bigint,
        queryId: number | bigint,
    ) {
        // return beginCell()
        // .storeUint(Op.mint, 32)
        // .storeUint(queryId, 64)
        // .storeAddress(to)
        // .storeCoins(totalTonAmount)
        // .storeCoins(jettonAmount)
        // .storeRef(beginCell()
        //     .storeUint(Op.internal_transfer, 32)
        //     .storeUint(queryId, 64)
        //     .storeCoins(jettonAmount)
        //     .storeAddress(null)
        //     .storeAddress(from)
        //     .storeCoins(forwardTonAmount)
        //     .storeMaybeRef(null)
        //     .endCell())
        // .endCell();
        const mintMsg = beginCell()
            .storeUint(Op.internal_transfer, 32)
            .storeUint(queryId, 64)
            .storeCoins(jettonAmount)
            .storeAddress(null)
            .storeAddress(from) // Response addr
            .storeCoins(forwardTonAmount)
            .storeMaybeRef(null)
            .endCell();

        return beginCell()
            .storeUint(Op.mint, 32)
            .storeUint(queryId, 64) // op, queryId
            .storeAddress(to)
            .storeCoins(totalTonAmount)
            .storeCoins(jettonAmount)
            .storeRef(mintMsg)
            .endCell();
    }

    async sendMint(
        provider: ContractProvider,
        via: Sender,
        to: Address,
        jettonAmount: bigint,
        forwardTonAmount: bigint,
        totalTonAmount: bigint,
        queryId: number | bigint,
    ) {
        await provider.internal(via, {
            value: totalTonAmount + toNano('0.015'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonMinter.mintMessage(this.address, to, jettonAmount, forwardTonAmount, totalTonAmount, queryId),
        });
    }

    async getWalletAddress(provider: ContractProvider, owner: Address) {
        let res = await provider.get('get_wallet_address', [
            { type: 'slice', cell: beginCell().storeAddress(owner).endCell() },
        ]);
        return res.stack.readAddress();
    }

    async getJettonData(provider: ContractProvider) {
        let res = await provider.get('get_jetton_data', []);
        let totalSupply = res.stack.readBigNumber();
        let mintable = res.stack.readBoolean();
        let adminAddress = res.stack.readAddress();
        let content = res.stack.readCell();
        let walletCode = res.stack.readCell();
        return {
            totalSupply,
            mintable,
            adminAddress,
            content,
            walletCode,
        };
    }

    async getTotalSupply(provider: ContractProvider) {
        let res = await this.getJettonData(provider);
        return res.totalSupply;
    }

    async getAdminAddress(provider: ContractProvider) {
        let res = await this.getJettonData(provider);
        return res.adminAddress;
    }

    async getContent(provider: ContractProvider) {
        let res = await this.getJettonData(provider);
        return res.content;
    }
}
