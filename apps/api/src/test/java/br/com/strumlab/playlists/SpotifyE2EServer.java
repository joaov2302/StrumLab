package br.com.strumlab.playlists;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import tools.jackson.databind.ObjectMapper;
import br.com.strumlab.StrumLabApplication;

/** Test-classpath-only launcher: explicitly refuses the personal database. */
public class SpotifyE2EServer {
    @TestConfiguration public static class Fixtures {
        @Bean(destroyMethod="close") FakeSpotify fakeSpotify()throws Exception{return new FakeSpotify(8130);}
        @Bean @Primary SpotifyClient fixtureClient(FakeSpotify fake,ObjectMapper json){return new SpotifyClient(json,"fixture-client",System.getenv().getOrDefault("SPOTIFY_REDIRECT_URI",SpotifyClientTest.CALLBACK),fake.base()+"/v1",fake.base());}
    }
    public static void main(String[] args){String db=System.getenv("DATABASE_URL");if(db==null||!db.endsWith("/strumlab_test"))throw new IllegalStateException("Synthetic Spotify requires isolated strumlab_test");System.out.println("SYNTHETIC SPOTIFY QA ONLY - NOT A REAL ACCOUNT CONNECTION");SpringApplication app=new SpringApplication(StrumLabApplication.class,Fixtures.class);app.run(args);}
}
