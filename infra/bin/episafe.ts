#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { resolveStage } from '../lib/config';
import { DatabaseStack } from '../lib/database-stack';
import { NetworkStack } from '../lib/network-stack';
import { ObservabilityStack } from '../lib/observability-stack';
import { RegistryStack } from '../lib/registry-stack';
import { SecretsStack } from '../lib/secrets-stack';
import { ServicesStack } from '../lib/services-stack';

const app = new App();
const config = resolveStage(app.node.tryGetContext('stage'));
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};
const prefix = `episafe-${config.stage}`;

const network = new NetworkStack(app, `${prefix}-network`, { env, config });
const secrets = new SecretsStack(app, `${prefix}-secrets`, { env, config });
const database = new DatabaseStack(app, `${prefix}-database`, {
  env,
  config,
  vpc: network.vpc,
  dbSecurityGroup: network.dbSecurityGroup,
});
const registry = new RegistryStack(app, `${prefix}-registry`, { env, config });

const services = new ServicesStack(app, `${prefix}-services`, {
  env,
  config,
  vpc: network.vpc,
  appSecurityGroup: network.appSecurityGroup,
  backRepo: registry.backRepo,
  iaRepo: registry.iaRepo,
  databaseUrl: database.databaseUrl,
  jwtSecret: secrets.jwtSecret,
  anthropicApiKey: secrets.anthropicApiKey,
  imageTag: String(app.node.tryGetContext('imageTag') ?? 'latest'),
});

new ObservabilityStack(app, `${prefix}-observability`, {
  env,
  config,
  database: database.instance,
  backService: services.backService,
  iaService: services.iaService,
});
