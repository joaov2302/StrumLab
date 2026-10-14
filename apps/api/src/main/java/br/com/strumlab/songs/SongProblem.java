package br.com.strumlab.songs;

public class SongProblem extends RuntimeException {
    private final int status;
    public SongProblem(int status, String message) { super(message); this.status = status; }
    public int status() { return status; }
}
