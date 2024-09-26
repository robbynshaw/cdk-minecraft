import { ECSClient, UpdateServiceCommand } from '@aws-sdk/client-ecs';
import { sendNotification } from './send-notification';

export async function zeroService(ecs: ECSClient, SERVICE: string, SERVERNAME: string, CLUSTER: string) {
    await sendNotification(SERVICE, SERVERNAME, 'shutdown');
    console.log('Setting desired task count to zero.');
    const command = new UpdateServiceCommand({
        cluster: CLUSTER,
        service: SERVICE,
        desiredCount: 0,
    });
    const resp = await ecs.send(command);
    process.exit(0);
}