// OpenTelemetry configuration for Supabase Edge Functions
// Note: Full OpenTelemetry support in Deno is limited. This is a basic implementation.

const APPSIGNAL_APP_NAME = 'thecrewacademy';
const APPSIGNAL_APP_ENV = Deno.env.get('APPSIGNAL_APP_ENV') || 'production';
const APPSIGNAL_PUSH_API_KEY = 'e5636314-9b82-4d61-8052-ccb53843166d';
const APPSIGNAL_COLLECTOR_URL = 'https://aa5pn4qg.eu-central.appsignal-collector.net';

interface TelemetrySpan {
  name: string;
  startTime: number;
  attributes?: Record<string, string | number | boolean>;
}

export class EdgeFunctionTracer {
  private functionName: string;
  private spans: Map<string, TelemetrySpan> = new Map();

  constructor(functionName: string) {
    this.functionName = functionName;
  }

  startSpan(name: string, attributes?: Record<string, string | number | boolean>) {
    this.spans.set(name, {
      name,
      startTime: Date.now(),
      attributes,
    });
  }

  endSpan(name: string) {
    const span = this.spans.get(name);
    if (span) {
      const duration = Date.now() - span.startTime;
      this.sendTrace(span.name, duration, span.attributes);
      this.spans.delete(name);
    }
  }

  private async sendTrace(
    spanName: string,
    duration: number,
    attributes?: Record<string, string | number | boolean>
  ) {
    try {
      const trace = {
        resourceSpans: [{
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: `${APPSIGNAL_APP_NAME}-${this.functionName}` } },
              { key: 'appsignal.config.name', value: { stringValue: APPSIGNAL_APP_NAME } },
              { key: 'appsignal.config.environment', value: { stringValue: APPSIGNAL_APP_ENV } },
              { key: 'appsignal.config.push_api_key', value: { stringValue: APPSIGNAL_PUSH_API_KEY } },
              { key: 'appsignal.config.language_integration', value: { stringValue: 'deno' } },
            ],
          },
          scopeSpans: [{
            spans: [{
              name: spanName,
              startTimeUnixNano: String((Date.now() - duration) * 1000000),
              endTimeUnixNano: String(Date.now() * 1000000),
              attributes: attributes ? Object.entries(attributes).map(([key, value]) => ({
                key,
                value: typeof value === 'string'
                  ? { stringValue: value }
                  : typeof value === 'number'
                  ? { intValue: value }
                  : { boolValue: value },
              })) : [],
            }],
          }],
        }],
      };

      await fetch(`${APPSIGNAL_COLLECTOR_URL}/v1/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trace),
      });
    } catch (error) {
      console.error('Failed to send trace:', error);
    }
  }

  async logError(error: Error, context?: Record<string, unknown>) {
    try {
      console.error('Edge Function Error:', {
        function: this.functionName,
        error: error.message,
        stack: error.stack,
        context,
      });
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }
}

export function createTracer(functionName: string): EdgeFunctionTracer {
  return new EdgeFunctionTracer(functionName);
}
