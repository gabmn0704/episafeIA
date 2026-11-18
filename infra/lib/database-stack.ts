import { Duration, Fn, RemovalPolicy, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { StageConfig } from './config';

export interface DatabaseStackProps extends StackProps {
  readonly config: StageConfig;
  readonly vpc: ec2.IVpc;
  readonly dbSecurityGroup: ec2.ISecurityGroup;
}

/** RDS PostgreSQL privado (subred aislada), cifrado con KMS, con backups y logs. */
export class DatabaseStack extends Stack {
  public readonly instance: rds.DatabaseInstance;
  public readonly credentials: secretsmanager.ISecret;
  /** postgres://user:pass@host:5432/db?sslmode=require, listo para DATABASE_URL. */
  public readonly databaseUrl: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);
    const { config, vpc, dbSecurityGroup } = props;
    const isProd = config.stage === 'prod';

    const key = new kms.Key(this, 'DbKey', {
      description: `EpiSafe ${config.stage}: cifrado de RDS (datos de salud)`,
      enableKeyRotation: true,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    this.instance = new rds.DatabaseInstance(this, 'Postgres', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: new ec2.InstanceType(config.db.instanceClass),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      publiclyAccessible: false,
      databaseName: 'episafe',
      credentials: rds.Credentials.fromGeneratedSecret('episafe', {
        secretName: `episafe/${config.stage}/db`,
        // Sin caracteres reservados de URL: la contraseña se inserta en DATABASE_URL.
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\=',
      }),
      allocatedStorage: config.db.allocatedStorageGb,
      maxAllocatedStorage: config.db.maxAllocatedStorageGb,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: key,
      multiAz: config.db.multiAz,
      backupRetention: Duration.days(config.db.backupRetentionDays),
      preferredBackupWindow: '07:00-08:00', // UTC, madrugada en Colombia
      copyTagsToSnapshot: true,
      deletionProtection: config.db.deletionProtection,
      removalPolicy: isProd ? RemovalPolicy.SNAPSHOT : RemovalPolicy.DESTROY,
      autoMinorVersionUpgrade: true,
      enablePerformanceInsights: config.db.performanceInsights,
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      cloudwatchLogsRetention: config.logRetentionDays as never,
      parameterGroup: new rds.ParameterGroup(this, 'Params', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16,
        }),
        parameters: {
          'rds.force_ssl': '1',
          log_min_duration_statement: '1000',
          log_connections: '1',
        },
      }),
    });

    this.credentials = this.instance.secret!;

    this.databaseUrl = new secretsmanager.Secret(this, 'DatabaseUrl', {
      secretName: `episafe/${config.stage}/database-url`,
      description: 'DATABASE_URL completa para el back (derivada del secreto de RDS)',
      secretStringValue: cdkSecretValue(
        Fn.join('', [
          'postgres://episafe:',
          this.credentials.secretValueFromJson('password').unsafeUnwrap(),
          '@',
          this.instance.dbInstanceEndpointAddress,
          ':',
          this.instance.dbInstanceEndpointPort,
          '/episafe?sslmode=require',
        ]),
      ),
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });
  }
}

/** Envuelve un valor resuelto por CloudFormation (referencia dinámica) como SecretValue. */
function cdkSecretValue(value: string): SecretValue {
  return SecretValue.unsafePlainText(value);
}
