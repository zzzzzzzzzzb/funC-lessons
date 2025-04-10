import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { JettonWallet } from '../wrappers/JettonWallet';

describe('JettonMinter', () => {
    let MinterCode: Cell;
    let WalletCode: Cell;
    let defaultContent: Cell;


    beforeAll(async () => {
        MinterCode = await compile('JettonMinter');
        WalletCode = await compile('JettonWallet');
        defaultContent = beginCell().endCell();
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let jettonWallet: any;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        jettonMinter = blockchain.openContract(JettonMinter.createFromConfig({
            Admin: deployer.address,
            Content: defaultContent,
            WalletCode: WalletCode,
        }, MinterCode));

        // jettonWallet = async (address: Address) => blockchain.openContract(
        //     JettonWallet.createFromAddress(
        //         await jettonMinter.getWalletAddress(address)
        //     )
        // );

        const deployResult = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            // success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonMinter are ready to use
    });

    it('admin mint jettons', async () => {
        let initTotalSupply = await jettonMinter.getTotalSupply();
        console.log(initTotalSupply);
        const mintResult = await jettonMinter.sendMint(deployer.getSender(), deployer.address, toNano('1000'), toNano('0.05'), toNano('1'), 1);
        const deployerWalletAddress = await jettonMinter.getWalletAddress(deployer.address);

        console.log("deployer address:", deployer.address);
        console.log("deployer wallet address:", deployerWalletAddress);
        console.log("minter address:", jettonMinter.address);

        expect(mintResult.transactions).toHaveTransaction({
            from: jettonMinter.address,
            to: deployerWalletAddress,
            deploy: true,
            success: true,
        });

        expect(mintResult.transactions).toHaveTransaction({ // excesses
            from: deployerWalletAddress,
            to: jettonMinter.address,
            success: true,
        });

        console.log(await jettonMinter.getTotalSupply())
    });
});

//