import { DescribeNetworkInterfacesCommand, EC2Client } from '@aws-sdk/client-ec2';

export async function getPublicIp(ec2: EC2Client, eni: string) {
    const command = new DescribeNetworkInterfacesCommand({
        NetworkInterfaceIds: [eni],
    });
    const eniInfo = await ec2.send(command);

    if (eniInfo.NetworkInterfaces?.length) {
        const ifc = eniInfo.NetworkInterfaces[0];
        const ip = ifc.Association?.PublicIp;
        if (ip) {
            return ip;
        }
    }
    throw new Error(`Unable to find public IP of eni: ${eni}`);
}