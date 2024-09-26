import axios from 'axios';

export async function sendNotification(SERVICE: string, SERVERNAME: string, type: 'startup' | 'shutdown') {
  const message = type === 'startup'
    ? `${SERVICE} is online at ${SERVERNAME}`
    : `Shutting down ${SERVICE} at ${SERVERNAME}`;
  console.log(message);

  const webhookUrl = 'https://discord.com/api/webhooks/1287412861890592808/2DJMPUvFaIClAqDxsjcfzGLFDbYT84gkLTVrBEvAHXCjtLkqXYd8EMOzLpnOdS-3c0-4';

  try {
    await axios.post(webhookUrl, { content: message }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(`${type} notification sent.`);
  } catch (error: any) {
    console.error(`Failed to send ${type} notification:`, error.message);
  }
}