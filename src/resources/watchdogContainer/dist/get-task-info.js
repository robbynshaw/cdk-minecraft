"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskInfo = getTaskInfo;
const client_ecs_1 = require("@aws-sdk/client-ecs");
async function getTaskInfo(ecs, CLUSTER, SERVICE) {
    // First, list the tasks for the specific service
    const listTasksCommand = new client_ecs_1.ListTasksCommand({
        cluster: CLUSTER,
        serviceName: SERVICE,
    });
    const listTasksResponse = await ecs.send(listTasksCommand);
    const taskArns = listTasksResponse.taskArns;
    if (!taskArns || taskArns.length === 0) {
        throw new Error('No tasks found.');
    }
    // Now, describe the tasks to get more details
    const describeTasksCommand = new client_ecs_1.DescribeTasksCommand({
        cluster: CLUSTER,
        tasks: taskArns,
    });
    const describeTasksResponse = await ecs.send(describeTasksCommand);
    const tasks = describeTasksResponse.tasks;
    if (!tasks || tasks.length === 0) {
        throw new Error('No task details found.');
    }
    if (tasks.length > 1) {
        throw new Error('Too many tasks found');
    }
    const task = tasks[0];
    const id = task.taskArn?.split('/').pop();
    if (!id) {
        throw new Error(`Task has no id: ARN: ${task.taskArn}`);
    }
    const attachments = task.attachments;
    if (!attachments?.length) {
        throw new Error('Task has no attachments');
    }
    const eni = attachments[0].details?.find(detail => detail.name === 'networkInterfaceId')?.value;
    if (!eni) {
        throw new Error('Could not find networkInterfaceId on task');
    }
    return { id, eni };
}
