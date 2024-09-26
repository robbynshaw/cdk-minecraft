import { ChangeResourceRecordSetsCommand, Route53Client } from '@aws-sdk/client-route-53';

export async function updateDnsRecord(region: string, publicIp: string, hostedZoneId: string, serverName: string) {
  const route53 = new Route53Client({ region });

  const command = new ChangeResourceRecordSetsCommand({
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
