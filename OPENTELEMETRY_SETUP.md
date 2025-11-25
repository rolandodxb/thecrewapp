# OpenTelemetry Integration with AppSignal

This application is configured to send telemetry data (traces, metrics, and logs) to AppSignal using OpenTelemetry.

## Configuration

### AppSignal Details
- **App Name**: `thecrewacademy`
- **Environment**: `production`
- **Push API Key**: `e5636314-9b82-4d61-8052-ccb53843166d`
- **Collector URL**: `https://aa5pn4qg.eu-central.appsignal-collector.net`

### Environment Variables

Add these to your `.env` file:

```bash
# AppSignal / OpenTelemetry Configuration
VITE_APPSIGNAL_PUSH_API_KEY=e5636314-9b82-4d61-8052-ccb53843166d
VITE_APPSIGNAL_COLLECTOR_URL=https://aa5pn4qg.eu-central.appsignal-collector.net
VITE_APPSIGNAL_APP_NAME=thecrewacademy
VITE_APPSIGNAL_APP_ENV=production
VITE_APP_REVISION=unknown
```

## Frontend Integration

The frontend automatically initializes OpenTelemetry when the app starts (`src/main.tsx`).

### What's Monitored

1. **HTTP Requests**: All `fetch` and XMLHttpRequest calls are automatically traced
2. **User Interactions**: Navigation and route changes
3. **Errors**: Uncaught errors and exceptions
4. **Performance Metrics**: Page load times, resource loading

### Files

- `src/lib/telemetry.ts` - Main OpenTelemetry configuration
- `src/main.tsx` - Initialization on app startup

### How It Works

```typescript
import { initializeTelemetry } from './lib/telemetry';

// Automatically called on app startup
initializeTelemetry();
```

The telemetry system:
- Creates a `WebTracerProvider` with AppSignal resource attributes
- Configures an OTLP exporter to send data to AppSignal
- Registers instrumentations for automatic tracing of HTTP requests
- Batches and sends traces to the collector

## Backend Integration (Supabase Edge Functions)

For Supabase Edge Functions, use the shared telemetry utility:

```typescript
import { createTracer } from '../_shared/telemetry.ts';

Deno.serve(async (req: Request) => {
  const tracer = createTracer('my-function-name');

  // Start a span for an operation
  tracer.startSpan('database-query', {
    query: 'SELECT * FROM users',
    user_id: userId
  });

  // ... do work ...

  // End the span
  tracer.endSpan('database-query');

  // Log errors with context
  try {
    // ... operation ...
  } catch (error) {
    await tracer.logError(error, { userId, action: 'checkout' });
    throw error;
  }
});
```

### Files

- `supabase/functions/_shared/telemetry.ts` - Edge Function tracing utility

## Resource Attributes

All telemetry data includes these AppSignal-specific attributes:

- `service.name`: Service identifier (e.g., `thecrewacademy-frontend`)
- `appsignal.config.name`: App name (`thecrewacademy`)
- `appsignal.config.environment`: Environment (`production`)
- `appsignal.config.push_api_key`: API key for authentication
- `appsignal.config.revision`: Git revision or version
- `appsignal.config.language_integration`: Language/runtime (`javascript` or `deno`)
- `appsignal.config.app_path`: Application path
- `host.name`: Hostname

## Viewing Data in AppSignal

1. Log into your AppSignal account
2. Navigate to the `thecrewacademy` application
3. View traces, metrics, and errors in the dashboard
4. Filter by environment, service name, or custom attributes

## Protocol Details

- **Exporter**: OTLP (OpenTelemetry Protocol)
- **Protocol**: HTTP with Protobuf encoding
- **Endpoint**: `https://aa5pn4qg.eu-central.appsignal-collector.net/v1/traces`
- **Batching**: Enabled (spans are batched before sending)

## Troubleshooting

### Check if telemetry is working

Open browser console and look for:
```
✅ OpenTelemetry initialized successfully
```

### Enable debug logging

Add to your browser console:
```javascript
localStorage.setItem('OTEL_LOG_LEVEL', 'debug');
```

Then refresh the page.

### Common Issues

1. **No data in AppSignal**: Check that the API key is correct
2. **CORS errors**: Ensure the collector URL allows your domain
3. **Build errors**: Ensure all OpenTelemetry packages are installed

## Dependencies

```json
{
  "@opentelemetry/api": "^1.x",
  "@opentelemetry/sdk-trace-web": "^1.x",
  "@opentelemetry/instrumentation": "^0.x",
  "@opentelemetry/exporter-trace-otlp-http": "^0.x",
  "@opentelemetry/resources": "^1.x",
  "@opentelemetry/semantic-conventions": "^1.x",
  "@opentelemetry/instrumentation-fetch": "^0.x",
  "@opentelemetry/instrumentation-xml-http-request": "^0.x",
  "@opentelemetry/sdk-trace-base": "^1.x"
}
```

## Production Considerations

1. **Sampling**: Consider implementing sampling for high-traffic applications
2. **Privacy**: Ensure no sensitive data (passwords, tokens) is included in traces
3. **Performance**: The batching processor minimizes performance impact
4. **Error Handling**: Telemetry failures don't affect app functionality

## For Java Backend Services

If you have Java backend services, use the OpenTelemetry Java agent:

```bash
# Set environment variables
export OTEL_TRACES_EXPORTER=otlp
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_ENDPOINT=https://aa5pn4qg.eu-central.appsignal-collector.net
export OTEL_SERVICE_NAME="my-java-service"

export APPSIGNAL_APP_NAME="thecrewacademy"
export APPSIGNAL_APP_ENV="production"
export APPSIGNAL_PUSH_API_KEY="e5636314-9b82-4d61-8052-ccb53843166d"

export OTEL_RESOURCE_ATTRIBUTES="\
appsignal.config.name=$APPSIGNAL_APP_NAME,\
appsignal.config.environment=$APPSIGNAL_APP_ENV,\
appsignal.config.push_api_key=$APPSIGNAL_PUSH_API_KEY,\
appsignal.config.revision=${REVISION:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)},\
appsignal.config.language_integration=java,\
appsignal.config.app_path=$PWD,\
host.name=${HOSTNAME:-$(hostname)}"

# Run with the Java agent
java -javaagent:opentelemetry-javaagent.jar -jar your-app.jar
```

Download the Java agent from: https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases
