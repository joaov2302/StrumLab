import {test,expect,type APIRequestContext} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {newContent,type SongDetail} from '../src/lib/songs';
import {newBook,type BookDetail,type BookExport} from '../src/lib/songbooks';
async function post<T>(request:APIRequestContext,path:string,data:unknown,origin:string){const response=await request.post(path,{headers:{Origin:origin},data});expect(response.ok(),await response.text()).toBe(true);return response.json() as Promise<T>;}
async function song(request:APIRequestContext,title:string,origin:string){const content=newContent();content.title=title;content.artist='Autor fictício';content.key='G';content.sections[0].lines[0].tokens=[{type:'chord',symbol:'G/B',value:null},{type:'text',value:'Ação e coração ↑ ↓ ° 🎶',symbol:null}];const created=await post<SongDetail>(request,'/api/songs',content,origin);return post<SongDetail>(request,`/api/songs/${created.song.id}/revisions`,{content,baseRevisionId:created.baseRevisionId,draftVersion:created.song.draftVersion},origin);}
test.describe('Songbook PDF workflow',()=>{
 test.skip(process.env.LIVE_API!=='1','Requires API and PostgreSQL');test.setTimeout(60000);
 test('organize, pin, preview exact PDF, update one item and preserve historical export',async({page,request,baseURL})=>{
   const origin=baseURL!;const suffix=Date.now();const a=await song(request,`Autoral A ${suffix}`,origin),b=await song(request,`Autoral B ${suffix}`,origin);
   await page.goto('/cancioneiros');await page.getByRole('button',{name:'Criar cancioneiro',exact:true}).click();await expect(page).toHaveURL(/\/cancioneiros\/[a-f0-9-]{36}$/);
   const montage=page.url(),id=montage.split('/').at(-1)!;
   await page.getByLabel('Título do cancioneiro',{exact:true}).fill(`Livro autoral ${suffix}`);await page.getByRole('button',{name:'Salvar capa e layout'}).click();await expect(page.getByRole('status')).toHaveText('Montagem salva');
   for(const value of [a,b]){await page.getByLabel('Buscar música para adicionar',{exact:true}).fill(value.draft.title);await page.getByRole('button',{name:`Selecionar ${value.draft.title}`,exact:true}).click();await page.getByRole('button',{name:'Adicionar revisão ao livro'}).click();await expect(page.getByRole('status')).toHaveText('Montagem salva');}
   await page.getByRole('button',{name:'Duplicar item 1',exact:true}).click();await expect(page.locator('.book-item-list>li')).toHaveCount(3);
   await page.getByRole('button',{name:'Remover item 3',exact:true}).click();await expect(page.locator('.book-item-list>li')).toHaveCount(2);
   await page.getByRole('button',{name:'Subir item 2',exact:true}).click();await expect(page.locator('.book-item-list h3').first()).toHaveText(b.draft.title);
   await page.getByRole('button',{name:'Gerar prévia',exact:true}).click();await expect(page).toHaveURL(/\/previa\?export=/);const preview=page.url(),exportId=new URL(preview).searchParams.get('export')!;
   await expect(page.getByRole('status')).toHaveText('Página 1 de 4');await expect(page.getByRole('link',{name:'Exportar PDF',exact:true})).toBeVisible();
   const metadata=await request.get(`/api/songbooks/${id}/exports/${exportId}`).then(r=>r.json()) as BookExport;expect(metadata.pageIndex.map(i=>i.title)).toEqual([b.draft.title,a.draft.title]);
   const downloadEvent=page.waitForEvent('download');await page.getByRole('link',{name:'Exportar PDF',exact:true}).click();const download=await downloadEvent;await download.saveAs('../../.cache/book-flow.pdf');
   const bytes=readFileSync('../../.cache/book-flow.pdf');expect(bytes.subarray(0,5).toString()).toBe('%PDF-');expect(createHash('sha256').update(bytes).digest('hex')).toBe(metadata.pdfSha256);
   await page.getByRole('button',{name:'Próxima página',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Página 2 de 4');
   const revised=await post<SongDetail>(request,`/api/songs/${a.song.id}/revisions`,{content:{...a.draft,title:`Nova edição ${suffix}`},baseRevisionId:a.baseRevisionId,draftVersion:a.song.draftVersion},origin);
   await page.goto(montage);await expect(page.getByText('Há uma revisão mais recente.',{exact:false})).toBeVisible();await expect(page.locator('.book-item-list h3').last()).toHaveText(a.draft.title);
   const oldBytes=await request.get(`/api/songbooks/${id}/exports/${exportId}/pdf`).then(r=>r.body());expect(oldBytes).toEqual(bytes);
   await page.getByRole('button',{name:'Atualizar somente este item',exact:true}).click();await expect(page.locator('.book-item-list h3').last()).toHaveText(revised.draft.title);await expect(page.getByRole('button',{name:'Gerar prévia',exact:true})).toBeEnabled();
   await page.goto(preview);await expect(page.getByRole('heading',{name:'PDF histórico',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Baixar PDF histórico',exact:true})).toBeVisible();
 });
 test('renderer failure retries without duplicate export; origin and internal result paths are denied',async({page,request,baseURL})=>{
   const origin=baseURL!,entry=await song(request,`Autoral recuperação ${Date.now()}`,origin);
   const book=await post<BookDetail>(request,'/api/songbooks',{...newBook(),title:'\u{10FFFF}'},origin);
   const added=await post<BookDetail>(request,`/api/songbooks/${book.book.id}/items`,{version:book.book.version,songId:entry.song.id,revisionId:entry.song.currentRevisionId,duplicate:false},origin);
   const exportPath=`/api/songbooks/${book.book.id}/exports`;const first=await request.post(exportPath,{headers:{Origin:origin},data:{version:added.book.version}});expect(first.status()).toBe(502);
   const second=await request.post(exportPath,{headers:{Origin:origin},data:{version:added.book.version}});expect(second.status()).toBe(502);
   const failed=await request.get(`/api/songbooks/${book.book.id}`).then(r=>r.json()) as BookDetail;expect(failed.exports).toHaveLength(1);expect(failed.exports[0].status).toBe('failed');
   await page.goto(`/cancioneiros/${book.book.id}`);await page.getByLabel('Título do cancioneiro',{exact:true}).fill('Livro recuperado');await page.getByRole('button',{name:'Salvar capa e layout'}).click();await expect(page.getByRole('status')).toHaveText('Montagem salva');await page.getByRole('button',{name:'Gerar prévia',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Página 1 de 3');
   const denied=await request.post('/api/songbooks',{headers:{Origin:'https://untrusted.example'},data:newBook()});expect(denied.status()).toBe(403);
   const internal=await request.put(`/api/songbooks/${book.book.id}/exports/${failed.exports[0].id}/result`,{headers:{Origin:origin},data:{}});expect(internal.status()).toBe(404);
 });
});
