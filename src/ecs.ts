/* eslint-disable @typescript-eslint/indent */
import path from 'path';
import { RemovalPolicy } from 'aws-cdk-lib';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  CpuArchitecture,
  FargateService,
  FargateTaskDefinition,
  OperatingSystemFamily,
  Protocol,
} from 'aws-cdk-lib/aws-ecs';
import { AccessPoint, FileSystem } from 'aws-cdk-lib/aws-efs';
import {
  Policy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { ServerConfig } from './minecraft';
import { MinecraftSettings } from './minecraft-settings';

interface ECSResourcesProps {
  vpc: Vpc;
  securityGroup: SecurityGroup;
  serverSubDomain: string;
  domain: string;
  hostedZoneId: string;
  memorySize: string;
  cpuSize: string;
  minecraftEdition: string;
  snsTopic?: Topic;
  startupMin: string;
  shutdownMin: string;
  serverConfig: ServerConfig;
  subDomainHostedZoneId: string;
  geyser: boolean;
}

export class ECSResources extends Construct {
  public task: FargateTaskDefinition;
  public cluster: Cluster;
  public service: FargateService;

  constructor(scope: Construct, id: string, props: ECSResourcesProps) {
    super(scope, id);

    this.cluster = new Cluster(this, 'Cluster', {
      vpc: props.vpc,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    const fileSystem = new FileSystem(this, 'fileSystem', {
      vpc: props.vpc,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const accessPoint = new AccessPoint(this, 'accessPoint', {
      fileSystem: fileSystem,
      path: '/minecraft',
      posixUser: {
        uid: '1000',
        gid: '1000',
      },
      createAcl: {
        ownerGid: '1000',
        ownerUid: '1000',
        permissions: '0750',
      },
    });

    const minecraftTaskRole = new Role(this, 'minecraftTaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      inlinePolicies: {
        mineCraftTaskPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: [
                'elasticfilesystem:ClientMount',
                'elasticfilesystem:ClientWrite',
                'elasticfilesystem:DescribeFileSystems',
              ],
            }),
            new PolicyStatement({
              actions: ['ecs:DescribeTasks', 'ecs:ListTasks'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    this.task = new FargateTaskDefinition(this, 'TaskDefinition', {
      memoryLimitMiB: Number(props.memorySize),
      cpu: Number(props.cpuSize),
      runtimePlatform: {
        operatingSystemFamily: OperatingSystemFamily.LINUX,
        cpuArchitecture: CpuArchitecture.X86_64,
      },
      taskRole: minecraftTaskRole,
      volumes: [
        {
          name: 'minecraft',
          efsVolumeConfiguration: {
            fileSystemId: fileSystem.fileSystemId,
            transitEncryption: 'ENABLED',
            authorizationConfig: {
              accessPointId: accessPoint.accessPointId,
              iam: 'ENABLED',
            },
          },
        },
      ],
    });

    this.service = new FargateService(this, 'FargateService', {
      serviceName: 'MineCraftService',
      cluster: this.cluster,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE',
          weight: 1,
          base: 1,
        },
      ],
      taskDefinition: this.task,
      assignPublicIp: true,
      desiredCount: 0,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      securityGroups: [props.securityGroup],
      enableExecuteCommand: true,
    });

    const minecraftServerContainer = this.task.addContainer(
      'MinecraftServerContainer',
      {
        image: ContainerImage.fromAsset(
          path.resolve(__dirname, './resources/minecraftContainer'),
        ),
        environment: {
          ...MinecraftSettings.environment,
          SHUTDOWN_TIMEOUT_MINUTES: props.shutdownMin,
          CLUSTER_NAME: this.cluster.clusterArn,
          SERVICE_ARN: this.service.serviceArn,
          SERVER_NAME: `${props.serverSubDomain}.${props.domain}`,
          HOSTED_ZONE_ID: props.subDomainHostedZoneId,
        },
        portMappings: [
          {
            containerPort: props.serverConfig.port,
            hostPort: props.serverConfig.port,
            protocol: props.serverConfig.protocol,
          },
          {
            // Geyser port mapping
            containerPort: 19132,
            hostPort: 19132,
            protocol: Protocol.UDP,
          },
        ],
        essential: true,
        logging: props.serverConfig.debug
          ? new AwsLogDriver({
            logRetention: RetentionDays.THREE_DAYS,
            streamPrefix: 'minecraft',
          })
          : undefined,
      },
    );

    minecraftServerContainer.addMountPoints({
      containerPath: '/data',
      sourceVolume: 'minecraft',
      readOnly: false,
    });

    // this.task.addContainer('WatchdogContainer', {
    //   image: ContainerImage.fromAsset(
    //     path.resolve(__dirname, './resources/watchdogContainer'),
    //   ),
    //   essential: true,
    //   environment: {
    //     CLUSTER: this.cluster.clusterName,
    //     SERVICE: 'MineCraftService',
    //     DNSZONE: props.subDomainHostedZoneId,
    //     SERVERNAME: `${props.serverSubDomain}.${props.domain}`,
    //     SNSTOPIC: props.snsTopic?.topicArn || '',
    //     STARTUPMIN: props.startupMin,
    //     SHUTDOWNMIN: props.shutdownMin,
    //     GEYSER: props.geyser ? 'TRUE' : 'FALSE',
    //   },
    //   logging: props.serverConfig.debug
    //     ? new AwsLogDriver({
    //       logRetention: RetentionDays.THREE_DAYS,
    //       streamPrefix: 'minecraft',
    //     })
    //     : undefined,
    // });

    const serverPolicy = new Policy(this, 'ServerPolicy', {
      statements: [
        new PolicyStatement({
          actions: ['ecs:*'],
          resources: [
            this.task.taskDefinitionArn,
            `${this.task.taskDefinitionArn}:/*}`,
            this.service.serviceArn,
            `${this.service.serviceArn}:/*}`,
            this.cluster.clusterArn,
            `${this.cluster.clusterArn}:/*}`,
          ],
        }),
        new PolicyStatement({
          actions: ['ec2:DescribeNetworkInterfaces'],
          resources: ['*'],
        }),
        new PolicyStatement({
          actions: [
            'route53:GetHostedZone',
            'route53:ChangeResourceRecordSets',
            'route53:ListResourceRecordSets',
          ],
          resources: [
            `arn:aws:route53:::hostedzone/${props.subDomainHostedZoneId}`,
          ],
        }),
      ],
    });
    serverPolicy.attachToRole(minecraftTaskRole);

    fileSystem.connections.allowDefaultPortFrom(this.service.connections);
  }
}
