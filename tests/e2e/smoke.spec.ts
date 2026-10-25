import { expect, test } from '@playwright/test';

test('home page responds 200 with lang="nb"', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('<html lang="nb">');
});
