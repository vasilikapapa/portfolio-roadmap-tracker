package com.vasilika.portfoliotracker.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptGen {
    public static void main(String[] args) {
        System.out.println(new BCryptPasswordEncoder().encode("super-long-32-characters-minimum-secret-key-123456"));
    }
}
