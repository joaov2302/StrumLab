package br.com.strumlab.songs;

import java.util.*;
import java.util.regex.Pattern;

public final class Music {
    private Music() {}
    // Supported qualities are explicit. Unknown symbols are rejected without loss.
    private static final Pattern CHORD = Pattern.compile("^([A-G])([#b]?)(|m|maj|min|dim|aug|sus[24]?|[+o°])(?:[0-9]{1,2})?(?:(?:add|sus|maj|dim|aug|[#b])[0-9]{1,2})*(?:/([A-G])([#b]?))?$");
    private static final String[] SHARPS = {"C","C#","D","D#","E","F","F#","G","G#","A","A#","B"};
    private static final String[] FLATS = {"C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"};
    public static boolean validChord(String symbol) { return symbol != null && symbol.length() <= 40 && CHORD.matcher(symbol).matches(); }
    public static boolean validKey(String key) { return key != null && key.matches("[A-G][#b]?m?"); }
    private static int pitch(String note) {
        int root = switch(note.charAt(0)) { case 'C' -> 0; case 'D' -> 2; case 'E' -> 4; case 'F' -> 5; case 'G' -> 7; case 'A' -> 9; case 'B' -> 11; default -> throw new SongProblem(422, "Nota inválida."); };
        if (note.length() > 1) root += note.charAt(1) == '#' ? 1 : note.charAt(1) == 'b' ? -1 : 0;
        return Math.floorMod(root, 12);
    }
    private static String transposeNote(String note, int semitones, String spelling) {
        return (spelling.equals("flats") ? FLATS : SHARPS)[Math.floorMod(pitch(note) + semitones, 12)];
    }
    public static String transposeChord(String symbol, int semitones, String spelling) {
        if (!validChord(symbol)) throw new SongProblem(422, "Acorde não reconhecido: " + symbol);
        String[] parts = symbol.split("/", -1);
        int rootLength = parts[0].length() > 1 && "#b".indexOf(parts[0].charAt(1)) >= 0 ? 2 : 1;
        return transposeNote(parts[0].substring(0, rootLength), semitones, spelling) + parts[0].substring(rootLength)
            + (parts.length == 2 ? "/" + transposeNote(parts[1], semitones, spelling) : "");
    }
    public static SongContent transpose(SongContent c, int semitones, String spelling) {
        validate(c);
        if (semitones < -12 || semitones > 12 || !Set.of("sharps", "flats").contains(spelling == null ? "" : spelling)) throw new SongProblem(422, "Transposição ou grafia inválida.");
        if (semitones == 0) return c;
        String key = c.key().isEmpty() ? "" : transposeChord(c.key(), semitones, spelling);
        return new SongContent(c.schemaVersion(), c.title(), c.artist(), key, c.bpm(), c.meter(), c.capo(), c.sourceType(), c.sourceReference(), c.rightsBasis(),
            c.sections().stream().map(s -> new SongContent.Section(s.id(), s.type(), s.label(),
                s.lines().stream().map(l -> new SongContent.Line(l.id(), l.tokens().stream().map(t ->
                    t.type().equals("chord") ? new SongContent.Token("chord", transposeChord(t.symbol(), semitones, spelling), null) : t).toList())).toList())).toList());
    }
    private static void require(boolean condition, String message) { if (!condition) throw new SongProblem(422, message); }
    public static void validate(SongContent c) {
        require(c != null && c.schemaVersion() == 1, "Versão de cifra inválida.");
        require(c.title() != null && !c.title().isBlank() && c.title().length() <= 200, "Informe um título de até 200 caracteres.");
        require(c.artist() != null && c.artist().length() <= 200, "Artista inválido.");
        require(c.key() != null && (c.key().isEmpty() || validKey(c.key())), "Tom inválido.");
        require(c.bpm() == null || (c.bpm() >= 20 && c.bpm() <= 400), "BPM deve estar entre 20 e 400.");
        require(c.meter() != null && c.meter().matches("(?:[1-9]|1[0-6])/(?:2|4|8|16)"), "Compasso inválido.");
        require(c.capo() >= 0 && c.capo() <= 12, "Capo deve estar entre 0 e 12.");
        require(Set.of("manual", "chordpro").contains(c.sourceType() == null ? "" : c.sourceType()), "Origem inválida.");
        require(c.sourceReference() != null && c.sourceReference().length() <= 1000, "Referência de origem inválida.");
        require(Set.of("unspecified", "own", "permission", "public_domain").contains(c.rightsBasis() == null ? "" : c.rightsBasis()), "Base de direitos inválida.");
        require(c.sections() != null && !c.sections().isEmpty() && c.sections().size() <= 100, "Use entre 1 e 100 seções.");
        Set<String> ids = new HashSet<>(); int lines = 0, tokens = 0, textSize = 0;
        for (var s : c.sections()) {
            require(s != null && s.id() != null && s.id().length() <= 80 && !s.id().isBlank() && ids.add(s.id()), "Identificador de seção inválido ou repetido.");
            require(Set.of("intro","verse","chorus","bridge","outro","other").contains(s.type() == null ? "" : s.type()), "Tipo de seção inválido.");
            require(s.label() != null && s.label().length() <= 120, "Nome de seção inválido.");
            require(s.lines() != null && !s.lines().isEmpty(), "A seção precisa de uma linha.");
            for (var l : s.lines()) {
                require(l != null && l.id() != null && l.id().length() <= 80 && !l.id().isBlank() && ids.add(l.id()), "Identificador de linha inválido ou repetido.");
                require(l.tokens() != null && l.tokens().size() <= 1000, "Tokens de linha inválidos.");
                lines++; tokens += l.tokens().size();
                for (var t : l.tokens()) {
                    require(t != null && t.type() != null, "Token inválido.");
                    if (t.type().equals("chord")) { require(validChord(t.symbol()) && t.value() == null, "Acorde não reconhecido ou token inválido."); }
                    else { require(t.type().equals("text") && t.value() != null && t.symbol() == null && !t.value().contains("\n") && !t.value().contains("\r"), "Token de texto inválido."); textSize += t.value().length(); }
                }
            }
        }
        require(lines <= 2000 && tokens <= 20000 && textSize <= 250000, "A cifra excede os limites do editor local.");
    }
}
