"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zeroService = zeroService;
const client_ecs_1 = require("@aws-sdk/client-ecs");
const send_notification_1 = require("./send-notification");
async function zeroService(ecs, SERVICE, SERVERNAME, CLUSTER) {
    await (0, send_notification_1.sendNotification)(SERVICE, SERVERNAME, 'shutdown');
    console.log('Setting desired task count to zero.');
    const command = new client_ecs_1.UpdateServiceCommand({
        cluster: CLUSTER,
        service: SERVICE,
        desiredCount: 0,
    });
    const resp = await ecs.send(command);
    process.exit(0);
}
