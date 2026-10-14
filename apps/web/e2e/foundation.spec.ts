import { test, expect } from '@playwright/test';
for (const width of [360, 390, 1440]) {
  test(`navigation and layout at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height:900});
    await page.goto('/');
    await expect(page.getByRole('heading', {level:1})).toHaveText('O repertório começa aqui.');
    await page.keyboard.press('Tab');
    await expect(page.getByText('Pular para o conteúdo')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    for (const [label, path] of [['Músicas','/musicas'], ['Cancioneiros','/cancioneiros'], ['Batidas','/batidas'], ['Preferências','/preferencias'], ['Início','/']]) {
      await page.getByRole('navigation').getByRole('link', {name:label, exact:true}).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole('navigation').getByRole('link', {name:label, exact:true})).toHaveAttribute('aria-current','page');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
}
test('API unavailable offers a real retry', async ({page}) => {
  await page.route('**/api/health', route => route.fulfill({status:503, json:{status:'down', database:'down', mode:'local'}}));
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('API ou banco indisponível');
  await page.unroute('**/api/health');
  await page.route('**/api/health', route => route.fulfill({json:{status:'up', database:'up', mode:'local'}}));
  await page.getByRole('button', {name:'Tentar novamente'}).click();
  await expect(page.getByRole('status')).toHaveText('API e PostgreSQL disponíveis');
});
test('live API and database health', async ({page}) => {
  test.skip(process.env.LIVE_API !== '1', 'Enable LIVE_API=1 with PostgreSQL and Java API running');
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('API e PostgreSQL disponíveis');
});
