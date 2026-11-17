#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { resolveStage } from '../lib/config';
import { DatabaseStack } from '../lib/database-stack';
import { NetworkStack } from '../lib/network-stack';
import { SecretsStack } from '../lib/secrets-stack';

const app = new App();
const config = resolveStage(app.node.tryGetContext('stage'));
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};
const prefix = `episafe-${config.stage}`;

const network = new NetworkStack(app, `${prefix}-network`, { env, config });
new SecretsStack(app, `${prefix}-secrets`, { env, config });
new DatabaseStack(app, `${prefix}-database`, {
  env,
  config,
  vpc: network.vpc,
  dbSecurityGroup: network.dbSecurityGroup,
});
