import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { JettonUtils } from '../wrappers/JettonUtils';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('JettonUtils', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('JettonUtils');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonUtils: SandboxContract<JettonUtils>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        jettonUtils = blockchain.openContract(JettonUtils.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await jettonUtils.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonUtils.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonUtils are ready to use
    });
});
