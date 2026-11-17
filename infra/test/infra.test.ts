import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { resolveStage } from '../lib/config';
import { DatabaseStack } from '../lib/database-stack';
import { NetworkStack } from '../lib/network-stack';
import { RegistryStack } from '../lib/registry-stack';

const env = { account: '111111111111', region: 'us-east-1' }; // cuenta ficticia

function build(stage: 'dev' | 'prod') {
  const app = new App();
  const config = resolveStage(stage);
  const network = new NetworkStack(app, 'net', { env, config });
  const db = new DatabaseStack(app, 'db', {
    env,
    config,
    vpc: network.vpc,
    dbSecurityGroup: network.dbSecurityGroup,
  });
  const registry = new RegistryStack(app, 'reg', { env, config });
  return {
    db: Template.fromStack(db),
    net: Template.fromStack(network),
    reg: Template.fromStack(registry),
  };
}

describe('config', () => {
  it('rechaza stages desconocidos', () => {
    expect(() => resolveStage('staging')).toThrow(/Stage inv/);
  });
});

describe.each(['dev', 'prod'] as const)('stage %s', (stage) => {
  const t = build(stage);

  it('RDS es privado, cifrado y con backups', () => {
    t.db.hasResourceProperties('AWS::RDS::DBInstance', {
      PubliclyAccessible: false,
      StorageEncrypted: true,
      BackupRetentionPeriod: Match.anyValue(),
    });
  });

  it('RDS fuerza SSL', () => {
    t.db.hasResourceProperties('AWS::RDS::DBParameterGroup', {
      Parameters: Match.objectLike({ 'rds.force_ssl': '1' }),
    });
  });

  it('ECR escanea al subir', () => {
    t.reg.hasResourceProperties('AWS::ECR::Repository', {
      ImageScanningConfiguration: { ScanOnPush: true },
    });
  });

  it('el security group de RDS no admite CIDR abiertos', () => {
    const rules = t.net.findResources('AWS::EC2::SecurityGroupIngress');
    for (const r of Object.values(rules)) {
      expect(JSON.stringify(r)).not.toContain('0.0.0.0/0');
    }
  });
});

it('prod activa Multi-AZ y proteccion contra borrado', () => {
  build('prod').db.hasResourceProperties('AWS::RDS::DBInstance', {
    MultiAZ: true,
    DeletionProtection: true,
  });
});
