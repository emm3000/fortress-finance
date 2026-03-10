import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app';

describe('App Basic Functional Test', () => {
  it('should return OK for the health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ status: 'OK', message: 'Servicio en línea' });
  });

  it('should return READY for the readiness check', async () => {
    const response = await request(app).get('/api/ready');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      status: 'READY',
      message: 'Servicio y base de datos disponibles',
    });
  });
});
