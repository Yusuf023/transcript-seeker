export default defineEventHandler((event) => {
  const trustedOrigins = useRuntimeConfig(event).trustedOrigins.split(',');
  const corsHandled = handleCors(event, {
    origin: trustedOrigins,
    preflight: {
      statusCode: 204,
    },
    credentials: true,
    methods: '*',
  });

  if (corsHandled) {
    return;
  }
});
