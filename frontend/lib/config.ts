function getRequiredEnv(key: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `\n❌ [FRONTEND ENV ERROR]: Missing required environment variable '${key}' in frontend/.env.local.\n` +
        `Please populate '${key}' in frontend/.env.local (refer to frontend/.env.example).\n`,
    );
  }
  return value.trim();
}

export const envConfig = {
  apiUrl: getRequiredEnv('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL),
  socketUrl: getRequiredEnv('NEXT_PUBLIC_SOCKET_URL', process.env.NEXT_PUBLIC_SOCKET_URL),
  appName: getRequiredEnv('NEXT_PUBLIC_APP_NAME', process.env.NEXT_PUBLIC_APP_NAME),
};
