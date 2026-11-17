import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { StageConfig } from './config';

export interface NetworkStackProps extends StackProps {
  readonly config: StageConfig;
}

/**
 * VPC con tres capas:
 *  - public:   NAT gateways (única salida a internet)
 *  - private:  VPC connector de App Runner (egress con NAT hacia Anthropic)
 *  - isolated: RDS (sin ruta a internet)
 */
export class NetworkStack extends Stack {
  public readonly vpc: ec2.Vpc;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);
    const { config } = props;

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: config.vpcMaxAzs,
      natGateways: config.natGateways,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // Flow logs de rechazos: útil para auditoría de acceso a datos de salud.
    this.vpc.addFlowLog('RejectedTraffic', {
      trafficType: ec2.FlowLogTrafficType.REJECT,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'FlowLogs', {
          retention: config.logRetentionDays as logs.RetentionDays,
        }),
      ),
    });

    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSg', {
      vpc: this.vpc,
      description: 'App Runner VPC connector (back + IA)',
      allowAllOutbound: true,
    });

    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: this.vpc,
      description: 'RDS PostgreSQL accepts traffic only from the app tier',
      allowAllOutbound: false,
    });
    this.dbSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL desde App Runner',
    );

    Tags.of(this).add('project', 'episafe-ia');
    Tags.of(this).add('stage', config.stage);
  }
}
