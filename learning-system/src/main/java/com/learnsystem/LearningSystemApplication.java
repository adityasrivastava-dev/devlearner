package com.learnsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LearningSystemApplication {
public static void main(String[] args) {
    SpringApplication.run(LearningSystemApplication.class, args);
}
}