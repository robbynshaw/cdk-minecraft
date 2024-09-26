import { EC2Client } from '@aws-sdk/client-ec2';
import { ECSClient } from '@aws-sdk/client-ecs';
import { getConfig } from './get-config';
import { getPublicIp } from './get-public-ip';
import { getTaskInfo } from './get-task-info';
import { isPortListening, printPorts } from './is-port-listening';
import { sendNotification } from './send-notification';
import { sleep } from './sleep';
import { updateDnsRecord } from './update-dns-record';
import { waitForAction } from './wait-for-action';
import { zeroService } from './zero-service';

const seconds = (amount: number) => 1000 * amount;
const minutes = (amount: number) => seconds(60) * amount;

const {
  CLUSTER,
  SERVICE,
  SERVERNAME,
  DNSZONE,
  STARTUPMIN,
  SHUTDOWNMIN,
  GEYSER,
  REGION,
} = getConfig();

const ecs = new ECSClient({ region: REGION });
const ec2 = new EC2Client({ region: REGION });

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, terminating task...');
  await zeroService(ecs, SERVICE, SERVERNAME, CLUSTER);
});

async function updateDNSToNewIP() {
  const { id: taskId, eni } = await getTaskInfo(ecs, CLUSTER, SERVICE);
  console.log(`I believe our task id is ${taskId}`);
  console.log(`I believe our eni is ${eni}`);

  const publicIp = await getPublicIp(ec2, eni);
  console.log(`I believe our public IP address is ${publicIp}`);

  await updateDnsRecord(REGION, publicIp, DNSZONE, SERVERNAME);
  console.log(`DNS record for ${SERVERNAME} updated to ${publicIp}`);
}

async function waitForListeningService(protocol: 'tcp' | 'udp', port: number, waitMinutes: number, established = false, intervalSeconds = 1) {
  try {
    await waitForAction(async () => {
      const result = await isPortListening(protocol, port, established);
      return result;
    }, seconds(intervalSeconds), minutes(waitMinutes));
  } catch (err) {
    throw new Error(`${waitMinutes} minute(s) elapsed without listening on ${protocol} port ${port}`);
  }
}

async function main(): Promise<void> {
  try {
    await updateDNSToNewIP();

    console.log('Printing ports...');
    printPorts();

    console.log('Waiting for Java and Bedrock ports to start listening...');
    await Promise.all([
      waitForListeningService('tcp', 25565, 10, false, 1),
      waitForListeningService('udp', 19132, 10, false, 1),
    ]);

    console.log('Waiting for RCON to startup...');
    await waitForListeningService('tcp', 25575, 5);
    await sendNotification(SERVICE, SERVERNAME, 'startup');

    console.log(`Checking every 1 minute for active connections to Minecraft, up to ${STARTUPMIN} minutes...`);
    let counter = 0;
    await Promise.race([
      waitForListeningService('tcp', 25565, STARTUPMIN + 1, true, 10),
      waitForListeningService('udp', 19132, STARTUPMIN + 1, true, 10),
      waitForAction(async () => {
        counter++;
        console.log(`${counter} minutes without an active connection`);
        return false;
      }, minutes(STARTUPMIN), minutes(1)),
    ]);

    console.log('We believe a connection has been made, switching to shutdown watcher.');
    counter = 0;

    while (counter <= SHUTDOWNMIN) {
      try {
        await Promise.race([
          waitForListeningService('tcp', 25565, 1, true, 10),
          waitForListeningService('udp', 19132, 1, true, 10),
        ]);
        await sleep(minutes(1));
      } catch {
        counter++;
        console.log(`${counter} minutes without an active connection`);
      }
    }

    throw new Error(`${SHUTDOWNMIN} minutes elapsed without a connection, terminating.`);
  } catch (err: any) {
    console.error(err.message);
    await zeroService(ecs, SERVICE, SERVERNAME, CLUSTER);
  }
}

main().catch(err => { });
