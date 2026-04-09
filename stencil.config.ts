import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'habit-tracker',
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
      baseUrl: 'http://localhost:3333/',
    },
  ],
  globalStyle: 'src/global/app.css',
};
