/**
 * Parámetros por stage. No contiene secretos ni IDs de cuenta:
 * la cuenta/región salen del entorno de despliegue (CDK_DEFAULT_*).
 */
export type StageName = 'dev' | 'prod';

export interface StageConfig {
  readonly stage: StageName;
  readonly vpcMaxAzs: number;
  readonly natGateways: number;
  readonly db: {
    readonly instanceClass: string; // p. ej. t4g.micro
    readonly allocatedStorageGb: number;
    readonly maxAllocatedStorageGb: number;
    readonly multiAz: boolean;
    readonly backupRetentionDays: number;
    readonly deletionProtection: boolean;
    readonly performanceInsights: boolean;
  };
  readonly service: {
    readonly backCpu: string;
    readonly backMemory: string;
    readonly iaCpu: string;
    readonly iaMemory: string;
    readonly minSize: number;
    readonly maxSize: number;
    readonly maxConcurrency: number;
  };
  readonly logRetentionDays: number;
  /** Origen del frontend en Vercel para CORS del back. */
  readonly corsOrigin: string;
  /** Correo opcional para suscribir alarmas a SNS (vacío = sin suscripción). */
  readonly alarmEmail: string;
}

const CONFIGS: Record<StageName, StageConfig> = {
  dev: {
    stage: 'dev',
    vpcMaxAzs: 2,
    natGateways: 1,
    db: {
      instanceClass: 't4g.micro',
      allocatedStorageGb: 20,
      maxAllocatedStorageGb: 50,
      multiAz: false,
      backupRetentionDays: 3,
      deletionProtection: false,
      performanceInsights: false,
    },
    service: {
      backCpu: '0.25 vCPU',
      backMemory: '0.5 GB',
      iaCpu: '0.25 vCPU',
      iaMemory: '0.5 GB',
      minSize: 1,
      maxSize: 2,
      maxConcurrency: 50,
    },
    logRetentionDays: 14,
    corsOrigin: 'https://episafe-dev.vercel.app',
    alarmEmail: '',
  },
  prod: {
    stage: 'prod',
    vpcMaxAzs: 2,
    natGateways: 2,
    db: {
      instanceClass: 't4g.small',
      allocatedStorageGb: 50,
      maxAllocatedStorageGb: 200,
      multiAz: true,
      backupRetentionDays: 14,
      deletionProtection: true,
      performanceInsights: true,
    },
    service: {
      backCpu: '0.5 vCPU',
      backMemory: '1 GB',
      iaCpu: '0.5 vCPU',
      iaMemory: '1 GB',
      minSize: 2,
      maxSize: 6,
      maxConcurrency: 80,
    },
    logRetentionDays: 90,
    corsOrigin: 'https://episafe.vercel.app',
    alarmEmail: '',
  },
};

export function resolveStage(raw: unknown): StageConfig {
  const name = String(raw ?? 'dev');
  if (name !== 'dev' && name !== 'prod') {
    throw new Error(`Stage inválido "${name}". Usa -c stage=dev | prod`);
  }
  return CONFIGS[name];
}
