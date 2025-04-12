import { toNano } from '@ton/core';
import { Operation } from '../wrappers/Operation';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const operation = provider.open(
        Operation.createFromConfig(
            {
                manager: provider.sender().address!,
            },
            await compile('Operation'),
        ),
    );

    await operation.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(operation.address);

    // run methods on `operation`
}
