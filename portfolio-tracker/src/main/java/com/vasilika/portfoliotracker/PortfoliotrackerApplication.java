package com.vasilika.portfoliotracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.vasilika.portfoliotracker")
public class PortfoliotrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(PortfoliotrackerApplication.class, args);
	}

}
