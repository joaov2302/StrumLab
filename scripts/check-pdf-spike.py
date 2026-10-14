import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path('.cache/pdf-tools').resolve()))
import pymupdf
from pypdf import PdfReader
root=pathlib.Path('.cache/pdf-spike')
summary=json.loads((root/'summary.json').read_text(encoding='utf-8'))
for entry in summary:
    columns=entry['columns']
    for engine in ('pdfkit','chromium'):
        path=root/f'{engine}-{columns}.pdf'
        reader=PdfReader(path); document=pymupdf.open(path)
        assert len(reader.pages)==entry['pages'], (engine,'page count')
        assert all(abs(float(page.mediabox.width)-595.2756)<1 and abs(float(page.mediabox.height)-841.8898)<1 for page in reader.pages)
        all_text='\n'.join(page.get_text() for page in document)
        assert all(value in all_text for value in ['Ação','coração','↑','↓','°','🎶','G/B','F#m7','C7sus4/Bb'])
        for index in entry['index']:
            text=document[index['page']-1].get_text()
            assert index['title'] in text, (engine,index)
            final=int(index['itemId'].split('-')[-1])+1
            assert f'FINAL-{final}' in all_text
        bad=[]
        for number,page in enumerate(document):
            for block in page.get_text('dict')['blocks']:
                for line in block.get('lines',[]):
                    for span in line['spans']:
                        x0,y0,x1,y1=span['bbox']
                        if x0<0 or y0<0 or x1>page.rect.width+.5 or y1>page.rect.height+.5: bad.append((number+1,span['text'],span['bbox']))
        assert not bad, (engine,bad[:5])
        for number in [0,1,2,entry['index'][2]['page']-1,entry['index'][3]['page']-1,len(document)-1]:
            document[number].get_pixmap(matrix=pymupdf.Matrix(1.1,1.1)).save(root/f'{engine}-{columns}-page-{number+1}.png')
        print(engine,columns,len(document),'pages: A4, Unicode, index and bounds verified')
