export const webauthnConfig = {
  rpID: process.env.RP_ID || 'localhost',
  rpName: 'The Crew Academy',
  origin: process.env.ORIGIN || 'http://localhost:5173',
  timeout: parseInt(process.env.WEBAUTHN_TIMEOUT || '60000'),
  challengeTTL: 5 * 60 * 1000,
};

export const getOrigins = (): string[] => {
  const originsEnv = process.env.ORIGINS;
  if (originsEnv) {
    try {
      return JSON.parse(originsEnv);
    } catch {
      return [originsEnv];
    }
  }
  return [webauthnConfig.origin];
};
