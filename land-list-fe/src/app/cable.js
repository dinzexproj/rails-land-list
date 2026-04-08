import { createConsumer } from '@rails/actioncable';
import { API_BASE_URL } from './api';

export function createCableConsumer(token) {
  const wsBase = API_BASE_URL.replace(/^http/, 'ws');
  return createConsumer(`${wsBase}/cable?token=${encodeURIComponent(token)}`);
}

