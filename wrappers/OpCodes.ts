import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type OpCodesConfig = {};

export function opCodesConfigToCell(config: OpCodesConfig): Cell {
    return beginCell().endCell();
}

export class OpCodes implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new OpCodes(address);
    }

    static createFromConfig(config: OpCodesConfig, code: Cell, workchain = 0) {
        const data = opCodesConfigToCell(config);
        const init = { code, data };
        return new OpCodes(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
