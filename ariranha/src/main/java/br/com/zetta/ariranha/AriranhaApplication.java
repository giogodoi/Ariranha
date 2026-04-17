package br.com.zetta.ariranha;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
//import org.springframework.context.annotation.Bean;
//import org.n52.jackson.datatype.jts.JtsModule; 
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class AriranhaApplication {

    public static void main(String[] args) {
        SpringApplication.run(AriranhaApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate() {
    return new RestTemplate();
    }
}