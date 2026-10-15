package br.com.strumlab.playlists;

import java.util.*;
import java.time.OffsetDateTime;

public final class PlaylistModels {
    private PlaylistModels() {}
    public record Connection(boolean configured, boolean connected, String redirectUri) {}
    public record Start(String authorizationUrl) {}
    public record Session(String browserSession) {}
    public record Callback(String browserSession,String state,String code,String error) {}
    public record Create(String url) {}
    public record Summary(UUID id,String externalId,String sourceUrl,String title,String status,int attempts,
                          String errorCode,long version,OffsetDateTime updatedAt,OffsetDateTime retryAfter) {}
    public record Item(UUID id,int position,String externalId,String title,String artist,boolean available,
                       boolean selected,String status,String errorCode,int attempts,UUID songId,UUID revisionId) {}
    public record Detail(Summary playlist,List<Item> items) {}
    public record Action(Long version,String action) {}
    public record Edit(Long version,String action,Boolean selected,UUID songId,UUID revisionId) {}
    public record Export(Long version,UUID requestKey,String title,List<UUID> itemIds,boolean allowPartial,boolean allowDuplicates) {}
    public record RemoteItem(int position,String externalId,String title,String artist,boolean available,String errorCode) {}
    public record RemotePlaylist(String title,String snapshot,List<RemoteItem> items) {}
}
