import { createProxyEventHandler } from 'h3-proxy';

export default eventHandler((event) => {
  const { meetingBaasApiUrl } = useRuntimeConfig(event);

  const proxy = createProxyEventHandler({
    target: meetingBaasApiUrl,
    pathRewrite: {
      '^/api/meetingbaas': '',
    },
    pathFilter: ['/api/meetingbaas/**'],
  });

  return proxy(event);
});
