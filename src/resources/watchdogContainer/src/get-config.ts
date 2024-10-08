export interface Config {
    CLUSTER: string;
    SERVICE: string;
    SERVERNAME: string;
    DNSZONE: string;
    STARTUPMIN: number;
    SHUTDOWNMIN: number;
    GEYSER: boolean;
    REGION: string;
}

export function getConfig(): Config {
    const CLUSTER = process.env.CLUSTER;
    const SERVICE = process.env.SERVICE;
    const SERVERNAME = process.env.SERVERNAME;
    const DNSZONE = process.env.DNSZONE as string;
    const STARTUPMIN = process.env.STARTUPMIN ? parseInt(process.env.STARTUPMIN) : 10;
    const SHUTDOWNMIN = process.env.SHUTDOWNMIN ? parseInt(process.env.SHUTDOWNMIN) : 20;
    const GEYSER = process.env.GEYSER === 'true';
    const REGION = process.env.REGION ?? 'us-east-1';

    if (!CLUSTER || !SERVICE || !SERVERNAME || !DNSZONE) {
        throw new Error('Required environment variables are missing.');
    }
    return {
        CLUSTER,
        SERVICE,
        SERVERNAME,
        DNSZONE,
        STARTUPMIN,
        SHUTDOWNMIN,
        GEYSER,
        REGION,
    };
}
