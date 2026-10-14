package br.com.strumlab.songbooks;
import java.io.*;
import java.util.*;
import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import br.com.strumlab.songs.SongProblem;
import static br.com.strumlab.songbooks.BookModels.*;

public final class BookValidation {
    private BookValidation() {}
    private static void require(boolean condition,String message){if(!condition)throw new SongProblem(422,message);}
    public static void config(Config c) {
        require(c!=null&&c.title()!=null&&!c.title().isBlank()&&c.title().length()<=200,"Título do cancioneiro inválido.");
        require(c.subtitle()!=null&&c.subtitle().length()<=300&&c.organizer()!=null&&c.organizer().length()<=200,"Texto de capa inválido.");
        require(c.layout()!=null&&c.cover()!=null,"Informe a capa e o layout.");
        var l=c.layout();require(Set.of("sans","serif").contains(l.font()==null?"":l.font())&&l.fontSize()>=9&&l.fontSize()<=16&&l.marginMm()>=10&&l.marginMm()<=25&&l.lineSpacing()>=1&&l.lineSpacing()<=1.6&&(l.columns()==1||l.columns()==2),"Layout A4 inválido.");
        var cover=c.cover();require(cover.imageData()!=null&&Set.of("unspecified","own","permission").contains(cover.imageRights()==null?"":cover.imageRights()),"Configuração de imagem inválida.");
        if(cover.imageData().isEmpty())return;
        require(!cover.imageRights().equals("unspecified"),"Declare autoria ou permissão para a imagem de capa.");
        require(cover.imageData().startsWith("data:image/png;base64,")||cover.imageData().startsWith("data:image/jpeg;base64,"),"Use imagem PNG ou JPEG local.");
        require(cover.imageData().length()<=2800000,"A imagem de capa excede 2 MiB.");
        try {
            byte[] bytes=Base64.getDecoder().decode(cover.imageData().substring(cover.imageData().indexOf(',')+1));require(bytes.length<=2097152,"Imagem muito grande.");
            try(var stream=new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))){
                var readers=ImageIO.getImageReaders(stream);require(readers.hasNext(),"Imagem inválida.");var reader=readers.next();
                try{reader.setInput(stream);int w=reader.getWidth(0),h=reader.getHeight(0);require(w>0&&h>0&&w<=3000&&h<=3000,"Use uma imagem de até 3000 × 3000 pixels.");
                    String type=reader.getFormatName().toLowerCase(Locale.ROOT);require((type.equals("png")&&cover.imageData().startsWith("data:image/png;"))||((type.equals("jpeg")||type.equals("jpg"))&&cover.imageData().startsWith("data:image/jpeg;")),"Tipo de imagem incompatível.");require(reader.read(0)!=null,"Não foi possível decodificar a imagem.");
                }finally{reader.dispose();}
            }
        }catch(IOException|IllegalArgumentException e){throw new SongProblem(422,"Imagem de capa inválida.");}
    }
}
