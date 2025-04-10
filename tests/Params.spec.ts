import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Params } from '../wrappers/Params';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Params', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Params');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let params: SandboxContract<Params>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        params = blockchain.openContract(Params.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await params.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: params.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and params are ready to use
    });
});
