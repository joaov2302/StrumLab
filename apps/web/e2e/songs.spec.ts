import { test,expect } from '@playwright/test';
test.describe('Local song workflow',()=>{
  test.skip(process.env.LIVE_API!=='1','Requires the Java API and PostgreSQL');
  test('create, reopen, transpose, capo, historical read, restore and archive',async({page})=>{
    await page.goto('/musicas');await page.getByRole('button',{name:'Criar cifra',exact:true}).click();
    await expect(page).toHaveURL(/\/musicas\/.+\/editar$/);
    const url=page.url();const songId=url.split('/').at(-2)!;
    await page.getByLabel('Salvar rascunho automaticamente').uncheck();
    const title=`Canção autoral E2E ${Date.now()}`;
    await page.getByLabel('Título',{exact:true}).fill(title);
    await page.getByLabel('Artista',{exact:true}).fill('Autor fictício');await page.getByLabel('Tom escrito',{exact:true}).fill('G');
    await page.getByLabel('Letra e acordes · Seção 1',{exact:true}).fill('[G/B]Ação e [Em7]coração 🎶\nLinha sem acordes');
    await page.getByRole('button',{name:'Adicionar seção'}).click();
    await page.getByLabel('Letra e acordes · Seção 2',{exact:true}).fill('[Bb]Refrão [D/F#]final');
    await page.getByRole('button',{name:'Salvar revisão',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Revisão 1 salva');
    await page.reload();await expect(page.getByLabel('Letra e acordes · Seção 1',{exact:true})).toHaveValue('[G/B]Ação e [Em7]coração 🎶\nLinha sem acordes');
    await page.getByLabel('Salvar rascunho automaticamente').uncheck();
    await page.getByLabel('Capo',{exact:true}).fill('2');await expect(page.getByLabel('Letra e acordes · Seção 1',{exact:true})).toHaveValue('[G/B]Ação e [Em7]coração 🎶\nLinha sem acordes');
    await page.getByRole('button',{name:'Transpor',exact:true}).click();
    await expect(page.getByLabel('Letra e acordes · Seção 1',{exact:true})).toHaveValue('[A/C#]Ação e [F#m7]coração 🎶\nLinha sem acordes');
    await page.getByRole('button',{name:'Desfazer',exact:true}).click();await expect(page.getByLabel('Tom escrito',{exact:true})).toHaveValue('G');await page.getByRole('button',{name:'Refazer',exact:true}).click();
    await page.getByRole('button',{name:'Salvar revisão',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Revisão 2 salva');
    await page.getByRole('button',{name:'Histórico (2)',exact:true}).click();
    const historical=await page.getByRole('link',{name:'Ler revisão 1',exact:true}).getAttribute('href');await page.goto(historical!);
    await expect(page.locator('.score-chord').filter({hasText:'G/B'})).toBeVisible();await expect(page.locator('.score-meta')).toContainText('Capo: 0');
    await page.goto(url);await page.getByRole('button',{name:'Histórico (2)',exact:true}).click();page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Restaurar revisão 1',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Revisão 3 salva por restauração');
    await page.goto('/musicas');await page.getByLabel('Buscar por título ou artista').fill(title);await expect(page.locator('.song-list li')).toHaveCount(1);
    await page.getByRole('button',{name:'Arquivar',exact:true}).click();await expect(page.getByRole('link',{name:title,exact:true})).toHaveCount(0);
    await page.getByRole('combobox',{name:'Estado',exact:true}).selectOption('archived');await expect(page.getByRole('link',{name:title,exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Reabrir',exact:true}).click();
    expect(songId).toMatch(/^[a-f0-9-]{36}$/);
  });
  test('autosave and two-tab conflict preserve both drafts',async({page,context})=>{
    await page.goto('/musicas');await page.getByRole('button',{name:'Criar cifra',exact:true}).click();await expect(page).toHaveURL(/\/editar$/);
    await page.getByLabel('Título',{exact:true}).fill(`Conflito autoral ${Date.now()}`);await expect(page.getByRole('status')).toHaveText('Rascunho salvo na biblioteca');
    const url=page.url();const other=await context.newPage();await other.goto(url);
    await other.getByLabel('Salvar rascunho automaticamente').uncheck();await other.getByLabel('Letra e acordes · Seção 1',{exact:true}).fill('[Em7]Rascunho da segunda aba');
    await page.getByLabel('Letra e acordes · Seção 1',{exact:true}).fill('[G]Rascunho da primeira aba');await expect(page.getByRole('status')).toHaveText('Rascunho salvo na biblioteca');
    await other.getByRole('button',{name:'Salvar revisão',exact:true}).click();await expect(other.getByRole('heading',{name:'Seu rascunho está preservado'})).toBeVisible();await expect(other.getByLabel('Letra e acordes · Seção 1',{exact:true})).toHaveValue('[Em7]Rascunho da segunda aba');
    await other.getByRole('button',{name:'Salvar meu rascunho como cópia',exact:true}).click();await expect(other).not.toHaveURL(url);await expect(other.getByLabel('Letra e acordes · Seção 1',{exact:true})).toHaveValue('[Em7]Rascunho da segunda aba');
    await page.reload();await expect(page.getByLabel('Letra e acordes · Seção 1',{exact:true})).toHaveValue('[G]Rascunho da primeira aba');
  });
  test('unsupported import and invalid chord keep the source text; proxy denies foreign origins',async({page,request})=>{
    await page.goto('/musicas');await page.getByText('Importar ChordPro básico',{exact:true}).click();await page.getByRole('textbox',{name:'Conteúdo ChordPro',exact:true}).fill('{unsupported: original}');await page.getByRole('button',{name:'Importar para editar'}).click();await expect(page.getByRole('alert').filter({hasText:'Diretiva não suportada'})).toBeVisible();await expect(page.getByRole('textbox',{name:'Conteúdo ChordPro',exact:true})).toHaveValue('{unsupported: original}');
    await page.getByRole('textbox',{name:'Conteúdo ChordPro',exact:true}).fill('{title: Canção importada}\n{key: G}\n[G]Texto autoral');await page.getByRole('button',{name:'Importar para editar'}).click();await expect(page.getByLabel('Título',{exact:true})).toHaveValue('Canção importada');
    await page.getByLabel('Letra e acordes · Seção 1',{exact:true}).fill('[H]Meu texto preservado');await expect(page.getByRole('button',{name:'Salvar revisão',exact:true})).toBeDisabled();await expect(page.getByLabel('Letra e acordes · Seção 1',{exact:true})).toHaveValue('[H]Meu texto preservado');
    const response=await request.post('/api/songs',{headers:{Origin:'https://untrusted.example'},data:{}});expect(response.status()).toBe(403);
  });
});
