import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type JettonWalletConfig = {};

export function jettonWalletConfigToCell(config: JettonWalletConfig): Cell {
    return beginCell().endCell();
}

export class JettonWallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new JettonWallet(address);
    }

    static createFromConfig(config: JettonWalletConfig, code: Cell, workchain = 0) {
        const data = jettonWalletConfigToCell(config);
        const init = { code, data };
        return new JettonWallet(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getWalletData(provider: ContractProvider) {
        let res = await provider.get('get_wallet_data', []);
        let balance = res.stack.readBigNumber();
        let ownerAddress = res.stack.readAddress();
        let minterAddress = res.stack.readAddress();
        let walletCode = res.stack.readCell();

        return { balance, ownerAddress, minterAddress, walletCode };
    }

    async getBalance(provider: ContractProvider) {
        let res = await this.getWalletData(provider);
        return res.balance;
    }

    async getOwnerAddress(provider: ContractProvider) {
        let res = await this.getWalletData(provider);
        return res.ownerAddress;
    }

    async getMinterAddress(provider: ContractProvider) {
        let res = await this.getWalletData(provider);
        return res.minterAddress;
    }

    async getWalletCode(provider: ContractProvider) {
        let res = await this.getWalletData(provider);
        return res.walletCode;
    }
}
