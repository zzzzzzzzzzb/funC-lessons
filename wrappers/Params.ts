import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type ParamsConfig = {};

export function paramsConfigToCell(config: ParamsConfig): Cell {
    return beginCell().endCell();
}

export class Params implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Params(address);
    }

    static createFromConfig(config: ParamsConfig, code: Cell, workchain = 0) {
        const data = paramsConfigToCell(config);
        const init = { code, data };
        return new Params(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
