package br.com.strumlab.analysis;
import java.util.*;
import java.time.OffsetDateTime;
public final class AnalysisModels {
    private AnalysisModels() {}
    public record ChordEvent(double start,double end,String chord) {}
    public record Result(int schemaVersion,String algorithmVersion,double duration,Double bpm,String key,String meter,Double confidence,List<ChordEvent> chords,List<String> warnings) {}
    public record Asset(UUID id,UUID songId,String extension,String mime,String rightsBasis,int sizeBytes,Double durationSeconds,String status,OffsetDateTime createdAt) {}
    public record Job(UUID id,UUID assetId,int generation,String status,int attempts,String errorCode,String algorithmVersion,OffsetDateTime createdAt,OffsetDateTime finishedAt,Result result) {}
    public record Detail(Asset asset,List<Job> jobs) {}
    public record Apply(UUID requestKey,UUID baseRevisionId,Long draftVersion,boolean applyBpm,Integer bpm,boolean applyKey,String key,boolean applyChords,List<ChordEvent> chords) {}
    public record Reprocess(UUID currentJobId,boolean reprocess) {}
}
