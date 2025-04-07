import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell } from '@ton/core';
import { Map } from '../wrappers/Map';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Map', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Map');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let map: SandboxContract<Map>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        blockchain.now = 500;

        blockchain.verbosity = {
            print: true,
            blockchainLogs: true,
            vmLogs: 'vm_logs',
            debugLogs: true,
        }
        deployer = await blockchain.treasury('deployer');

        map = blockchain.openContract(Map.createFromConfig({
            
        }, code));

        const deployResult = await map.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: map.address,
            deploy: true,
            // success: true,
        });
        await map.sendSet(deployer.getSender(), toNano('0.05'), {
            queryId: 123n,
            key: 1n,
            validUntil: 1000n,
            value: beginCell().storeUint(123, 16).endCell().asSlice(),
        });
    
        await map.sendSet(deployer.getSender(), toNano('0.05'), {
            queryId: 123n,
            key: 2n,
            validUntil: 2000n,
            value: beginCell().storeUint(234, 16).endCell().asSlice(),
        });
    
        await map.sendSet(deployer.getSender(), toNano('0.05'), {
            queryId: 123n,
            key: 3n,
            validUntil: 3000n,
            value: beginCell().storeUint(345, 16).endCell().asSlice(),
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and map are ready to use
    });
    it('should store and retrieve values', async () => {
        let [validUntil, value] = await map.getKey(1n);
        expect(validUntil).toEqual(1000n);
        expect(value).toEqualSlice(
            beginCell().storeUint(123, 16).endCell().asSlice()
        );
    
        [validUntil, value] = await map.getKey(2n);
        expect(validUntil).toEqual(2000n);
        expect(value).toEqualSlice(
            beginCell().storeUint(234, 16).endCell().asSlice()
        );
    
        [validUntil, value] = await map.getKey(3n);
        expect(validUntil).toEqual(3000n);
        expect(value).toEqualSlice(
            beginCell().storeUint(345, 16).endCell().asSlice()
        );
    });

    it('should throw on not found key', async () => {
        await expect(map.getKey(123n)).rejects.toThrow();
    });

    it.only('should clear old values', async () => {
        // await map.sendClear(deployer.getSender(), toNano('0.05'), {
        //     queryId: 123n,
        // });
    
        // let [validUntil, value] = await map.getKey(1n);
        // expect(validUntil).toEqual(1000n);
        // expect(value).toEqualSlice(
        //     beginCell().storeUint(123, 16).endCell().asSlice()
        // );
    
        blockchain.now = 1500;
    
        await map.sendClear(deployer.getSender(), toNano('0.05'), {
            queryId: 123n,
        });

        // [validUntil, value] = await map.getKey(1n);

        await expect(map.getKey(1n)).rejects.toThrow();
    
        // [validUntil, value] = await map.getKey(2n);
        // expect(validUntil).toEqual(2000n);
        // expect(value).toEqualSlice(
        //     beginCell().storeUint(234, 16).endCell().asSlice()
        // );
    
        // [validUntil, value] = await map.getKey(3n);
        // expect(validUntil).toEqual(3000n);
        // expect(value).toEqualSlice(
        //     beginCell().storeUint(345, 16).endCell().asSlice()
        // );
    
        // blockchain.now = 3001;
    
        // await map.sendClear(deployer.getSender(), toNano('0.05'), {
        //     queryId: 123n,
        // });
    
        // await expect(map.getKey(2n)).rejects.toThrow();
        // await expect(map.getKey(3n)).rejects.toThrow();
    });
});
