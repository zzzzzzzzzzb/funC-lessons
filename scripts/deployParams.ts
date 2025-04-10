import { toNano } from '@ton/core';
import { Params } from '../wrappers/Params';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const params = provider.open(Params.createFromConfig({}, await compile('Params')));

    await params.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(params.address);

    // run methods on `params`
}
