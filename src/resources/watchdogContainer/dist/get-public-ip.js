"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicIp = getPublicIp;
const client_ec2_1 = require("@aws-sdk/client-ec2");
async function getPublicIp(ec2, eni) {
    const command = new client_ec2_1.DescribeNetworkInterfacesCommand({
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
