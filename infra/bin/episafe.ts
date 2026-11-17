#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { resolveStage } from '../lib/config';
import { NetworkStack } from '../lib/network-stack';

const app = new App();
const config = resolveStage(app.node.tryGetContext('stage'));
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

new NetworkStack(app, `episafe-${config.stage}-network`, { env, config });
