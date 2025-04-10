import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { OpCodes } from '../wrappers/OpCodes';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('OpCodes', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('OpCodes');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let opCodes: SandboxContract<OpCodes>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        opCodes = blockchain.openContract(OpCodes.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await opCodes.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: opCodes.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and opCodes are ready to use
    });
});
