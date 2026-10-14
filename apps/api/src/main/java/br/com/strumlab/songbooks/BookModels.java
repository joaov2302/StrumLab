package br.com.strumlab.songbooks;
import java.util.*;
import java.time.OffsetDateTime;
import br.com.strumlab.songs.SongContent;

public final class BookModels {
    private BookModels() {}
    public record Cover(boolean enabled,String imageData,String imageRights) {}
    public record Layout(String font,int fontSize,int marginMm,double lineSpacing,int columns) {}
    public record Config(String title,String subtitle,String organizer,Cover cover,Layout layout) {}
    public record Summary(UUID id,String title,String subtitle,boolean archived,long version,int itemCount,OffsetDateTime updatedAt) {}
    public record Item(UUID id,UUID songId,UUID revisionId,int revisionNo,int position,String notes,SongContent content,UUID latestRevisionId,boolean songArchived) {}
    public record Page(List<Summary> items,int total) {}
    public record Detail(Summary book,Config config,List<Item> items,List<Export> exports) {}
    public record ManifestItem(UUID itemId,UUID songId,UUID revisionId,int revisionNo,SongContent content,String notes) {}
    public record Manifest(int schemaVersion,String rendererVersion,UUID songbookId,long bookVersion,String title,String subtitle,String organizer,Cover cover,Layout layout,List<ManifestItem> items) {}
    public record PageIndex(UUID itemId,String title,int page,int revisionNo) {}
    public record Export(UUID id,UUID songbookId,long bookVersion,String manifestHash,String rendererVersion,String status,Integer pageCount,List<PageIndex> pageIndex,String pdfSha256,String errorCode,OffsetDateTime createdAt) {}
    public record RenderClaim(Export export,Manifest manifest,UUID leaseToken) {}
    public record Result(UUID leaseToken,String manifestHash,String pdfBase64,int pageCount,List<PageIndex> pageIndex) {}
}
