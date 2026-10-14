package br.com.strumlab.songs;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.assertj.core.api.Assertions.*;
class MusicTest {
    @ParameterizedTest @CsvSource({"G,A","Em7,F#m7","Bb,C","F#m,G#m","D/F#,E/G#","G/B,A/C#","C7sus4/D,D7sus4/E","Cm7b5/Eb,Dm7b5/F","B#,D","Cb,C#"})
    void rootsAndBassTransposeTogether(String chord,String expected) { assertThat(Music.transposeChord(chord,2,"sharps")).isEqualTo(expected); }
    @Test void flatsAndNegativeShifts() {
        assertThat(Music.transposeChord("G/B",-2,"flats")).isEqualTo("F/A");
        assertThat(Music.transposeChord("A#",0,"flats")).isEqualTo("Bb");
    }
    @Test void everyPitchRoundTripsInSharpConvention() {
        for(String chord:new String[]{"C","C#","D","D#","E","F","F#","G","G#","A","A#","B","D/F#","G/B","F#m7"})
            for(int shift=-12;shift<=12;shift++)assertThat(Music.transposeChord(Music.transposeChord(chord,shift,"sharps"),-shift,"sharps")).isEqualTo(chord);
    }
    @Test void unknownSymbolsAreNotSilentlyChanged() {
        for(String chord:new String[]{"H","G//B","G/foo","x","C(foo)","Am/"})assertThatThrownBy(()->Music.transposeChord(chord,2,"sharps")).isInstanceOf(SongProblem.class);
    }
}
