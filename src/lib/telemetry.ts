import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';

const APPSIGNAL_APP_NAME = import.meta.env.VITE_APPSIGNAL_APP_NAME || 'thecrewacademy';
const APPSIGNAL_APP_ENV = import.meta.env.VITE_APPSIGNAL_APP_ENV || 'production';
const APPSIGNAL_PUSH_API_KEY = import.meta.env.VITE_APPSIGNAL_PUSH_API_KEY || 'e5636314-9b82-4d61-8052-ccb53843166d';
const APPSIGNAL_COLLECTOR_URL = import.meta.env.VITE_APPSIGNAL_COLLECTOR_URL || 'https://aa5pn4qg.eu-central.appsignal-collector.net';

export function initializeTelemetry() {
  try {
    const revision = import.meta.env.VITE_APP_REVISION || 'unknown';
    const hostname = window.location.hostname;

    const resource = resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: 'thecrewacademy-frontend',
      [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
      'appsignal.config.name': APPSIGNAL_APP_NAME,
      'appsignal.config.environment': APPSIGNAL_APP_ENV,
      'appsignal.config.push_api_key': APPSIGNAL_PUSH_API_KEY,
      'appsignal.config.revision': revision,
      'appsignal.config.language_integration': 'javascript',
      'appsignal.config.app_path': window.location.origin,
      'host.name': hostname,
    });

    const exporter = new OTLPTraceExporter({
      url: `${APPSIGNAL_COLLECTOR_URL}/v1/traces`,
      headers: {
        'Content-Type': 'application/x-protobuf',
      },
    });

    const provider = new WebTracerProvider({
      resource: resource,
    });

    provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    provider.register();

    registerInstrumentations({
      instrumentations: [
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: [
            /.+/,
          ],
          clearTimingResources: true,
        }),
        new XMLHttpRequestInstrumentation({
          propagateTraceHeaderCorsUrls: [
            /.+/,
          ],
        }),
      ],
    });

    console.log('✅ OpenTelemetry initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize OpenTelemetry:', error);
  }
}
