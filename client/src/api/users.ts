import { client } from './client';

export async function createGuestUser(name: string) {
  const response = await client.post('/users/guest', { name });
  return response.data;
}
