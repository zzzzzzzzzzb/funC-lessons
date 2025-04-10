import { toNano } from '@ton/core';
import { JettonUtils } from '../wrappers/JettonUtils';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const jettonUtils = provider.open(JettonUtils.createFromConfig({}, await compile('JettonUtils')));

    await jettonUtils.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jettonUtils.address);

    // run methods on `jettonUtils`
}
