package br.com.strumlab.songs;

import java.util.List;

public record SongContent(int schemaVersion, String title, String artist, String key,
        Integer bpm, String meter, int capo, String sourceType, String sourceReference,
        String rightsBasis, List<Section> sections) {
    public record Section(String id, String type, String label, List<Line> lines) {}
    public record Line(String id, List<Token> tokens) {}
    public record Token(String type, String symbol, String value) {}
}
