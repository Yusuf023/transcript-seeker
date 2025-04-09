import { createProxyEventHandler } from 'h3-proxy';

export default eventHandler((event) => {
  const { meetingBaasS3Url } = useRuntimeConfig(event);

  const proxy = createProxyEventHandler({
    target: meetingBaasS3Url,
    pathRewrite: {
      '^/api/s3': '',
    },
    pathFilter: ['/api/s3/**'],
  });

  return proxy(event);
});
