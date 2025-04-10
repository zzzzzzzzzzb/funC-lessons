import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type JettonUtilsConfig = {};

export function jettonUtilsConfigToCell(config: JettonUtilsConfig): Cell {
    return beginCell().endCell();
}

export class JettonUtils implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonUtils(address);
    }

    static createFromConfig(config: JettonUtilsConfig, code: Cell, workchain = 0) {
        const data = jettonUtilsConfigToCell(config);
        const init = { code, data };
        return new JettonUtils(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
