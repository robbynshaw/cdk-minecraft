const ecs = require('@aws-sdk/client-ecs');

const DEFAULT_REGION = 'us-west-2';
const DEFAULT_CLUSTER = 'minecraft';
const DEFAULT_SERVICE = 'minecraft-server';

const REGION = process.env.REGION || DEFAULT_REGION;
const CLUSTER = process.env.CLUSTER || DEFAULT_CLUSTER;
const SERVICE = process.env.SERVICE || DEFAULT_SERVICE;

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1287412861890592808/2DJMPUvFaIClAqDxsjcfzGLFDbYT84gkLTVrBEvAHXCjtLkqXYd8EMOzLpnOdS-3c0-4';

if (!REGION || !CLUSTER || !SERVICE) {
  throw new Error("Missing environment variables");
}

async function sendDiscordNotification(message) {
  try {
    const payload = { content: message };
    const headers = { 'Content-Type': 'application/json' };
    await fetch(WEBHOOK_URL, { method: 'POST', body: JSON.stringify(payload), headers });
    console.log(`Notification sent: ${message}`);
  } catch (error) {
    console.error(`Failed to send notification: ${error.message}`);
  }
}

exports.handler = async (event, context) => {
  const client = new ecs.ECSClient({ region: REGION });

  try {
    const command = new ecs.DescribeServicesCommand({
      cluster: CLUSTER,
      services: [SERVICE],
    });
    const response = await client.send(command);

    const desired = response.services[0].desiredCount;

    if (desired === 0) {
      const cmd = new ecs.UpdateServiceCommand({
        cluster: CLUSTER,
        service: SERVICE,
        desiredCount: 1,
      });
      await client.send(cmd);
      console.log("Updated desiredCount to 1");
      sendDiscordNotification("Starting up Minecraft server");
    } else {
      console.log("desiredCount already at 1");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};