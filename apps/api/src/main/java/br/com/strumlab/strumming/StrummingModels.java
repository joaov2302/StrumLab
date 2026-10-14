package br.com.strumlab.strumming;
import java.util.*;
public final class StrummingModels {
    private StrummingModels() {}
    public record Event(int slot,String direction,boolean play,boolean accent,double velocity) {}
    public record Pattern(String id,String name,int version,String difficulty,String style,String timeSignature,int defaultBpm,int subdivisionsPerBar,List<Event> events) {}
    public record Snapshot(Pattern pattern,int bpm,String notes,boolean showInPdf) {}
    public record Binding(long version,Snapshot snapshot) {}
    public record Edit(Long version,String patternId,int patternVersion,int bpm,String notes,boolean showInPdf) {}
}
