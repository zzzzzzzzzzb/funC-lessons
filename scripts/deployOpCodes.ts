import { toNano } from '@ton/core';
import { OpCodes } from '../wrappers/OpCodes';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const opCodes = provider.open(OpCodes.createFromConfig({}, await compile('OpCodes')));

    await opCodes.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(opCodes.address);

    // run methods on `opCodes`
}
