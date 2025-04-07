import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell } from '@ton/core';
import { Operation } from '../wrappers/Operation';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { randomAddress } from '@ton/test-utils';

describe('Operation', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Operation');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let operation: SandboxContract<Operation>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        operation = blockchain.openContract(Operation.createFromConfig({
            manager: deployer.address,
        }, code));

        const deployResult = await operation.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: operation.address,
            deploy: true,
            // success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and operation are ready to use
    });
    it('should change saved address by manager', async () => {
        const address = randomAddress();
        const result = await operation.sendChangeAddress(
            deployer.getSender(),
            toNano('0.01'),
            12345n,
            address,
        );
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: operation.address,
            success: true,
        });
    });
    it('should not change saved address by manager', async () => {
        // 只有manager可以改变地址
        const user = await blockchain.treasury('user');
        const address = randomAddress();
        const result = await operation.sendChangeAddress(
            user.getSender(),
            toNano('0.01'),
            12345n,
            address,
        );
        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: operation.address,
            success: false, // 失败
        });
    });
    it('should return required data on `requestAddress` call', async () => {
        const address = randomAddress();
        await operation.sendChangeAddress(
            deployer.getSender(),
            toNano('0.01'),
            12345n,
            address
        );
    
        let user = await blockchain.treasury('user');
        const result = await operation.sendRequestAddress(
            user.getSender(),
            toNano('0.01'),
            12345n
        );
        expect(result.transactions).toHaveTransaction({
            from: operation.address,
            to: user.address,
            body: beginCell()
                .storeUint(3, 32)
                .storeUint(12345n, 64)
                .storeAddress(deployer.address)
                .storeAddress(address)
                .endCell(),
        });
    });
    it('should throw on any other opcode', async () => {
        const result = await deployer.send({
            to: operation.address,
            value: toNano('0.01'),
            body: beginCell().storeUint(5, 32).storeUint(12345n, 64).endCell(),
        });
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: operation.address,
            exitCode: 3,
        });
    });
});
