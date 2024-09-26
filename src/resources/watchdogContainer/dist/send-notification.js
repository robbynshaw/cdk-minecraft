"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const axios_1 = __importDefault(require("axios"));
async function sendNotification(SERVICE, SERVERNAME, type) {
    const message = type === 'startup'
        ? `${SERVICE} is online at ${SERVERNAME}`
        : `Shutting down ${SERVICE} at ${SERVERNAME}`;
    console.log(message);
    const webhookUrl = 'https://discord.com/api/webhooks/1287412861890592808/2DJMPUvFaIClAqDxsjcfzGLFDbYT84gkLTVrBEvAHXCjtLkqXYd8EMOzLpnOdS-3c0-4';
    try {
        await axios_1.default.post(webhookUrl, { content: message }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log(`${type} notification sent.`);
    }
    catch (error) {
        console.error(`Failed to send ${type} notification:`, error.message);
    }
}
