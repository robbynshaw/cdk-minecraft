"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_ecs_1 = require("@aws-sdk/client-ecs");
const get_config_1 = require("./get-config");
const get_public_ip_1 = require("./get-public-ip");
const get_task_info_1 = require("./get-task-info");
const send_notification_1 = require("./send-notification");
const sleep_1 = require("./sleep");
const try_find_listening_port_1 = require("./try-find-listening-port");
const update_dns_record_1 = require("./update-dns-record");
const wait_for_action_1 = require("./wait-for-action");
const zero_service_1 = require("./zero-service");
const seconds = (amount) => 1000 * amount;
const minutes = (amount) => seconds(60) * amount;
const { CLUSTER, SERVICE, SERVERNAME, DNSZONE, STARTUPMIN, SHUTDOWNMIN, GEYSER, REGION, } = (0, get_config_1.getConfig)();
const ecs = new client_ecs_1.ECSClient({ region: REGION });
const ec2 = new client_ec2_1.EC2Client({ region: REGION });
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, terminating task...');
    await (0, zero_service_1.zeroService)(ecs, SERVICE, SERVERNAME, CLUSTER);
});
async function updateDNSToNewIP() {
    const { id: taskId, eni } = await (0, get_task_info_1.getTaskInfo)(ecs, CLUSTER, SERVICE);
    console.log(`I believe our task id is ${taskId}`);
    console.log(`I believe our eni is ${eni}`);
    const publicIp = await (0, get_public_ip_1.getPublicIp)(ec2, eni);
    console.log(`I believe our public IP address is ${publicIp}`);
    await (0, update_dns_record_1.updateDnsRecord)(REGION, publicIp, DNSZONE, SERVERNAME);
    console.log(`DNS record for ${SERVERNAME} updated to ${publicIp}`);
}
async function waitForListeningService(protocol, port, waitMinutes, established = false, intervalSeconds = 1) {
    try {
        await (0, wait_for_action_1.waitForAction)(async () => {
            const result = await (0, try_find_listening_port_1.isPortListening)(protocol, port, established);
            return result;
        }, seconds(intervalSeconds), minutes(waitMinutes));
    }
    catch (err) {
        throw new Error(`${waitMinutes} minute(s) elapsed without listening on ${protocol} port ${port}`);
    }
}
async function main() {
    try {
        await updateDNSToNewIP();
        console.log('Waiting for Java and Bedrock ports to start listening...');
        await (0, try_find_listening_port_1.isPortListening)('tcp', 0, false);
        await (0, try_find_listening_port_1.isPortListening)('udp', 0, false);
        await Promise.all([
            waitForListeningService('tcp', 25565, 10, false, 10),
            waitForListeningService('udp', 19132, 10, false, 10),
        ]);
        console.log('Waiting for RCON to startup...');
        await waitForListeningService('tcp', 25575, 5);
        await (0, send_notification_1.sendNotification)(SERVICE, SERVERNAME, 'startup');
        console.log(`Checking every 1 minute for active connections to Minecraft, up to ${STARTUPMIN} minutes...`);
        let counter = 0;
        await Promise.race([
            waitForListeningService('tcp', 25565, STARTUPMIN + 1, true, 10),
            waitForListeningService('udp', 19132, STARTUPMIN + 1, true, 10),
            (0, wait_for_action_1.waitForAction)(async () => {
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
                await (0, sleep_1.sleep)(minutes(1));
            }
            catch {
                counter++;
                console.log(`${counter} minutes without an active connection`);
            }
        }
        throw new Error(`${SHUTDOWNMIN} minutes elapsed without a connection, terminating.`);
    }
    catch (err) {
        console.error(err.message);
        await (0, zero_service_1.zeroService)(ecs, SERVICE, SERVERNAME, CLUSTER);
    }
}
main().catch(err => { });
