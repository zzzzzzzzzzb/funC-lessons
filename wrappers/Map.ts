import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Slice, TupleItemSlice } from '@ton/core';

export type MapConfig = {};

export function mapConfigToCell(config: MapConfig): Cell {
    return beginCell().endCell();
}

export class Map implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Map(address);
    }

    static createFromConfig(config: MapConfig, code: Cell, workchain = 0) {
        const data = mapConfigToCell(config);
        const init = { code, data };
        return new Map(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    // 发送op=1的消息，即增加键值对
    async sendSet(
        provider: ContractProvider, 
        via: Sender, 
        value: bigint,
        opts: {
            queryId: bigint;
            key: bigint;
            validUntil: bigint;
            value: Slice;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(1, 32)
            .storeUint(opts.queryId, 64)
            .storeUint(opts.key, 256)
            .storeUint(opts.validUntil, 64)
            .storeSlice(opts.value)
            .endCell(),
        });
    }
    
    // 发送op=2的消息，即清理过期键值对
    async sendClear(
        provider: ContractProvider, 
        via: Sender, 
        value: bigint,
        opts: {
            queryId: bigint;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(2, 32)
            .storeUint(opts.queryId, 64)
            .endCell(),
        });
    }

    // 查询，调用get_key函数
    async getKey(
        provider: ContractProvider, 
        key: bigint,
    ) :Promise<[bigint, Slice]>{
        const result = (await provider.get('get_key', [
            {
                type: 'int',
                value: key
            }
        ])).stack;
        return [result.readBigNumber(), (result.peek() as TupleItemSlice).cell.asSlice()]; 
    }
}
