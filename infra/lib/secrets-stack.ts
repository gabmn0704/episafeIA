import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { StageConfig } from './config';

export interface SecretsStackProps extends StackProps {
  readonly config: StageConfig;
}

/**
 * Secretos de aplicación. Ningún valor vive en el repo:
 *  - JWT_SECRET se genera aleatoriamente (64 chars) por Secrets Manager.
 *  - ANTHROPIC_API_KEY se crea vacío; el valor se carga a mano tras el deploy:
 *      aws secretsmanager put-secret-value --secret-id episafe/<stage>/anthropic-api-key --secret-string "<key>"
 *    Mientras tenga el placeholder aleatorio, el servicio IA cae a sus plantillas (sin Claude).
 */
export class SecretsStack extends Stack {
  public readonly jwtSecret: secretsmanager.Secret;
  public readonly anthropicApiKey: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id, props);
    const { config } = props;
    const removal = config.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    this.jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      secretName: `episafe/${config.stage}/jwt-secret`,
      description: 'Firma de JWT (access/refresh) del back de EpiSafe',
      generateSecretString: { passwordLength: 64, excludePunctuation: true },
      removalPolicy: removal,
    });

    this.anthropicApiKey = new secretsmanager.Secret(this, 'AnthropicApiKey', {
      secretName: `episafe/${config.stage}/anthropic-api-key`,
      description: 'API key de Anthropic para /explain (cargar manualmente)',
      // Placeholder aleatorio: se reemplaza con put-secret-value. Una key inválida
      // hace que /explain caiga a plantillas (el servicio IA captura el error).
      generateSecretString: { passwordLength: 24, excludePunctuation: true },
      removalPolicy: removal,
    });
  }
}
