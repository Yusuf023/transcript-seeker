import { createProxyEventHandler } from 'h3-proxy';
import { eventHandler } from 'h3';
import { useRuntimeConfig } from '#imports';

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
