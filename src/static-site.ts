import * as path from 'path';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { BucketWebsiteTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

interface StaticWebsiteProps {
  websiteSourcePath: string; // Path to your local website files
  subdomain: string; // The subdomain name (e.g., "blog")
  domainName: string; // The parent domain name (e.g., "example.com")
  hostedZoneId: string; // Hosted Zone ID for the domain in Route 53
}

export class StaticWebsite extends Construct {
  constructor(scope: Construct, id: string, props: StaticWebsiteProps) {
    super(scope, id);

    // Full domain name (subdomain + domain)
    const fullDomainName = `${props.subdomain}.${props.domainName}`;

    // Create an S3 bucket for the static website
    const websiteBucket = new Bucket(this, 'WebsiteBucket', {
      bucketName: fullDomainName, // Bucket name must match the full subdomain name
      websiteIndexDocument: 'index.html',
      // websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY, // Change to RETAIN for production
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
    });

    // Deploy website content to the S3 bucket
    new BucketDeployment(this, 'WebsiteDeployment', {
      sources: [Source.asset(path.resolve(props.websiteSourcePath))],
      destinationBucket: websiteBucket,
    });

    // Retrieve the Hosted Zone
    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      zoneName: props.domainName,
      hostedZoneId: props.hostedZoneId,
    });

    // Create an ARecord in Route 53 that points to the S3 website
    new ARecord(this, 'WebsiteAliasRecord', {
      zone: hostedZone,
      recordName: props.subdomain, // Just the subdomain part
      target: RecordTarget.fromAlias(new BucketWebsiteTarget(websiteBucket)),
    });

    // Output the website URL
    new CfnOutput(this, 'WebsiteURL', {
      value: `http://${fullDomainName}`,
      description: 'The URL of the static website',
    });
  }
}
