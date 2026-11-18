import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
import { StageConfig } from './config';

export interface RegistryStackProps extends StackProps {
  readonly config: StageConfig;
}

/** Repositorios ECR para las imágenes del back y del servicio IA. */
export class RegistryStack extends Stack {
  public readonly backRepo: ecr.Repository;
  public readonly iaRepo: ecr.Repository;

  constructor(scope: Construct, id: string, props: RegistryStackProps) {
    super(scope, id, props);
    const { config } = props;
    const isProd = config.stage === 'prod';

    const make = (name: string, logical: string) =>
      new ecr.Repository(this, logical, {
        repositoryName: `episafe-${config.stage}/${name}`,
        imageScanOnPush: true,
        imageTagMutability: isProd ? ecr.TagMutability.IMMUTABLE : ecr.TagMutability.MUTABLE,
        encryption: ecr.RepositoryEncryption.AES_256,
        removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        emptyOnDelete: !isProd,
        lifecycleRules: [
          { description: 'Conserva las últimas 20 imágenes', maxImageCount: 20 },
        ],
      });

    this.backRepo = make('back', 'BackRepo');
    this.iaRepo = make('ia', 'IaRepo');
  }
}
