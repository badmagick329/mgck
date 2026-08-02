export function getFilesUrl(environment = process.env.NODE_ENV) {
  return environment === 'development'
    ? 'http://localhost:8002/files/'
    : '/files/';
}
