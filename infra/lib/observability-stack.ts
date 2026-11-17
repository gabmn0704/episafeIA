import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { StageConfig } from './config';

export interface ObservabilityStackProps extends StackProps {
  readonly config: StageConfig;
  readonly database: rds.IDatabaseInstance;
  readonly backService: apprunner.CfnService;
  readonly iaService: apprunner.CfnService;
}

/** Alarmas basicas (SNS) y dashboard de CloudWatch para RDS y App Runner. */
export class ObservabilityStack extends Stack {
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);
    const { config, database } = props;

    this.alarmTopic = new sns.Topic(this, 'Alarms', {
      topicName: `episafe-${config.stage}-alarms`,
    });
    if (config.alarmEmail) {
      this.alarmTopic.addSubscription(new subs.EmailSubscription(config.alarmEmail));
    }
    const action = new cwActions.SnsAction(this.alarmTopic);

    const alarm = (
      name: string,
      metric: cloudwatch.IMetric,
      threshold: number,
      op: cloudwatch.ComparisonOperator,
      description: string,
    ) => {
      const a = new cloudwatch.Alarm(this, name, {
        alarmName: `episafe-${config.stage}-${name}`,
        alarmDescription: description,
        metric,
        threshold,
        evaluationPeriods: 3,
        datapointsToAlarm: 2,
        comparisonOperator: op,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      a.addAlarmAction(action);
      return a;
    };

    // ---- RDS ----
    const cpu = database.metricCPUUtilization({ period: Duration.minutes(5) });
    const storage = database.metricFreeStorageSpace({ period: Duration.minutes(5) });
    const conns = database.metricDatabaseConnections({ period: Duration.minutes(5) });
    alarm('rds-cpu-high', cpu, 80, cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD, 'CPU de RDS > 80%');
    alarm(
      'rds-storage-low',
      storage,
      2 * 1024 * 1024 * 1024,
      cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      'Menos de 2 GB libres en RDS',
    );
    alarm('rds-connections-high', conns, 80, cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD, 'Conexiones a RDS > 80');

    // ---- App Runner ----
    const svcMetric = (svc: apprunner.CfnService, metricName: string, stat: string) =>
      new cloudwatch.Metric({
        namespace: 'AWS/AppRunner',
        metricName,
        dimensionsMap: { ServiceName: svc.serviceName!, ServiceID: svc.attrServiceId },
        statistic: stat,
        period: Duration.minutes(5),
      });

    const back5xx = svcMetric(props.backService, '5xxStatusResponses', 'Sum');
    const backLatency = svcMetric(props.backService, 'RequestLatency', 'p95');
    const ia5xx = svcMetric(props.iaService, '5xxStatusResponses', 'Sum');
    alarm('back-5xx', back5xx, 10, cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD, 'Mas de 10 errores 5xx en 5 min (back)');
    alarm('back-latency-p95', backLatency, 1500, cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD, 'Latencia p95 del back > 1.5 s');
    alarm('ia-5xx', ia5xx, 10, cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD, 'Mas de 10 errores 5xx en 5 min (IA)');

    new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `episafe-${config.stage}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({ title: 'RDS CPU %', left: [cpu], width: 8 }),
          new cloudwatch.GraphWidget({ title: 'RDS conexiones', left: [conns], width: 8 }),
          new cloudwatch.GraphWidget({ title: 'RDS espacio libre', left: [storage], width: 8 }),
        ],
        [
          new cloudwatch.GraphWidget({ title: 'Back 5xx', left: [back5xx], width: 8 }),
          new cloudwatch.GraphWidget({ title: 'Back latencia p95', left: [backLatency], width: 8 }),
          new cloudwatch.GraphWidget({ title: 'IA 5xx', left: [ia5xx], width: 8 }),
        ],
      ],
    });
  }
}
