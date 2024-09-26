"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDnsRecord = updateDnsRecord;
const client_route_53_1 = require("@aws-sdk/client-route-53");
async function updateDnsRecord(region, publicIp, hostedZoneId, serverName) {
    const route53 = new client_route_53_1.Route53Client({ region });
    const command = new client_route_53_1.ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
            Comment: 'Fargate Public IP change for Minecraft Server',
            Changes: [
                {
                    Action: 'UPSERT',
                    ResourceRecordSet: {
                        Name: serverName,
                        Type: 'A',
                        TTL: 30,
                        ResourceRecords: [{ Value: publicIp }],
                    },
                },
            ],
        },
    });
    await route53.send(command);
}
