import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, beginCell, toNano } from '@ton/core';
import { Proxy } from '../wrappers/Proxy';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Proxy', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Proxy');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let proxy: SandboxContract<Proxy>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        proxy = blockchain.openContract(Proxy.createFromConfig({
            owner: deployer.address,
        }, code));

        const deployResult = await proxy.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: proxy.address,
            deploy: true,
            success: true,
        });
    });

    it('get deployer', async () => {
        console.log("proxy address: ", proxy.address);
        console.log("deployer address: ", deployer.address);
        console.log("owner address: ", await proxy.getOwner());
    });

    it('should not forward ', async () => {
        const result = await deployer.send({
            to: proxy.address,
            value: toNano('0.05'),
        });
        // 此时由于发送地址等于owner地址，所以不会转发
        // 就不会存在从proxy到deployer的交易
        expect(result.transactions).not.toHaveTransaction({
            from: proxy.address,
            to: deployer.address,
        });
    });

    it('should forward ', async () => {
        // 新建一个钱包用户，构造非owner地址发送消息的情况
        const user1 = await blockchain.treasury('user1');

        const result = await user1.send({
            to: proxy.address,
            value: toNano('1'),
            body: beginCell().storeStringTail('Hello World!').endCell(),
        });
        expect(result.transactions).toHaveTransaction({
            from: proxy.address,
            to: deployer.address,
            body: beginCell().storeAddress(user1.address).storeStringRefTail('Hello World!').endCell(),
        });
    })

});
