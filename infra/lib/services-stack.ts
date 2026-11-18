import { Stack, StackProps } from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { StageConfig } from './config';

export interface ServicesStackProps extends StackProps {
  readonly config: StageConfig;
  readonly vpc: ec2.IVpc;
  readonly appSecurityGroup: ec2.ISecurityGroup;
  readonly backRepo: ecr.IRepository;
  readonly iaRepo: ecr.IRepository;
  readonly databaseUrl: secretsmanager.ISecret;
  readonly jwtSecret: secretsmanager.ISecret;
  readonly anthropicApiKey: secretsmanager.ISecret;
  /** Tag de imagen a desplegar (-c imageTag=abc123). */
  readonly imageTag: string;
}

/**
 * Back (publico, lo consume el frontend en Vercel) e IA (privado: solo
 * accesible desde la VPC mediante un VPC Ingress Connection).
 * Ambos salen a la VPC por un VPC connector para alcanzar RDS y, via NAT, a Anthropic.
 */
export class ServicesStack extends Stack {
  public readonly backService: apprunner.CfnService;
  public readonly iaService: apprunner.CfnService;

  constructor(scope: Construct, id: string, props: ServicesStackProps) {
    super(scope, id, props);
    const { config, vpc, appSecurityGroup, imageTag } = props;

    // Rol para que App Runner descargue imagenes de ECR.
    const accessRole = new iam.Role(this, 'EcrAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSAppRunnerServicePolicyForECRAccess',
        ),
      ],
    });

    // Roles de instancia: cada servicio lee solo los secretos que necesita.
    const backRole = new iam.Role(this, 'BackInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });
    props.databaseUrl.grantRead(backRole);
    props.jwtSecret.grantRead(backRole);

    const iaRole = new iam.Role(this, 'IaInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });
    props.anthropicApiKey.grantRead(iaRole);

    const connector = new apprunner.CfnVpcConnector(this, 'VpcConnector', {
      vpcConnectorName: `episafe-${config.stage}`,
      subnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds,
      securityGroups: [appSecurityGroup.securityGroupId],
    });

    const scaling = new apprunner.CfnAutoScalingConfiguration(this, 'Scaling', {
      autoScalingConfigurationName: `episafe-${config.stage}`,
      minSize: config.service.minSize,
      maxSize: config.service.maxSize,
      maxConcurrency: config.service.maxConcurrency,
    });

    const network = (isPublic: boolean): apprunner.CfnService.NetworkConfigurationProperty => ({
      egressConfiguration: {
        egressType: 'VPC',
        vpcConnectorArn: connector.attrVpcConnectorArn,
      },
      ingressConfiguration: { isPubliclyAccessible: isPublic },
    });

    const health = (path: string): apprunner.CfnService.HealthCheckConfigurationProperty => ({
      protocol: 'HTTP',
      path,
      interval: 10,
      timeout: 5,
      healthyThreshold: 1,
      unhealthyThreshold: 5,
    });

    // ---- Servicio IA (privado) ----
    this.iaService = new apprunner.CfnService(this, 'IaService', {
      serviceName: `episafe-${config.stage}-ia`,
      sourceConfiguration: {
        authenticationConfiguration: { accessRoleArn: accessRole.roleArn },
        autoDeploymentsEnabled: false,
        imageRepository: {
          imageRepositoryType: 'ECR',
          imageIdentifier: `${props.iaRepo.repositoryUri}:${imageTag}`,
          imageConfiguration: {
            port: '5000',
            runtimeEnvironmentVariables: [
              { name: 'NODE_ENV', value: 'production' },
              { name: 'PORT', value: '5000' },
            ],
            runtimeEnvironmentSecrets: [
              { name: 'ANTHROPIC_API_KEY', value: props.anthropicApiKey.secretArn },
            ],
          },
        },
      },
      instanceConfiguration: {
        cpu: config.service.iaCpu,
        memory: config.service.iaMemory,
        instanceRoleArn: iaRole.roleArn,
      },
      healthCheckConfiguration: health('/health'),
      networkConfiguration: network(false),
      autoScalingConfigurationArn: scaling.attrAutoScalingConfigurationArn,
    });

    // Endpoint de interfaz hacia App Runner para alcanzar el servicio privado.
    const endpointSg = new ec2.SecurityGroup(this, 'AppRunnerEndpointSg', {
      vpc,
      description: 'Interface endpoint to private App Runner services',
    });
    endpointSg.addIngressRule(appSecurityGroup, ec2.Port.tcp(443), 'HTTPS from the back');

    const endpoint = new ec2.InterfaceVpcEndpoint(this, 'AppRunnerEndpoint', {
      vpc,
      service: new ec2.InterfaceVpcEndpointService(
        `com.amazonaws.${this.region}.apprunner.requests`,
        443,
      ),
      securityGroups: [endpointSg],
      privateDnsEnabled: false,
    });

    const ingress = new apprunner.CfnVpcIngressConnection(this, 'IaIngress', {
      vpcIngressConnectionName: `episafe-${config.stage}-ia`,
      serviceArn: this.iaService.attrServiceArn,
      ingressVpcConfiguration: {
        vpcId: vpc.vpcId,
        vpcEndpointId: endpoint.vpcEndpointId,
      },
    });

    // ---- Back (publico) ----
    this.backService = new apprunner.CfnService(this, 'BackService', {
      serviceName: `episafe-${config.stage}-back`,
      sourceConfiguration: {
        authenticationConfiguration: { accessRoleArn: accessRole.roleArn },
        autoDeploymentsEnabled: false,
        imageRepository: {
          imageRepositoryType: 'ECR',
          imageIdentifier: `${props.backRepo.repositoryUri}:${imageTag}`,
          imageConfiguration: {
            port: '4000',
            runtimeEnvironmentVariables: [
              { name: 'NODE_ENV', value: 'production' },
              { name: 'PORT', value: '4000' },
              { name: 'DATABASE_SSL', value: 'true' },
              { name: 'CORS_ORIGIN', value: config.corsOrigin },
              { name: 'AI_SERVICE_URL', value: `https://${ingress.attrDomainName}` },
            ],
            runtimeEnvironmentSecrets: [
              { name: 'DATABASE_URL', value: props.databaseUrl.secretArn },
              { name: 'JWT_SECRET', value: props.jwtSecret.secretArn },
            ],
          },
        },
      },
      instanceConfiguration: {
        cpu: config.service.backCpu,
        memory: config.service.backMemory,
        instanceRoleArn: backRole.roleArn,
      },
      healthCheckConfiguration: health('/api/v1/health'),
      networkConfiguration: network(true),
      autoScalingConfigurationArn: scaling.attrAutoScalingConfigurationArn,
    });
  }
}
