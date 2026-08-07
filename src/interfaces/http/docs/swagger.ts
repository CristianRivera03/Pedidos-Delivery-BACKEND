import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './swagger.config';

export function setupSwagger(app: Application): void {
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Pedidos Delivery API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    }),
  );
}
