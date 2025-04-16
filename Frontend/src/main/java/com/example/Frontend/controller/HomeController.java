package com.example.Frontend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

@Controller
public class HomeController {

    private final RestTemplate restTemplate;
    private final String backendUrl = "http://localhost:8080/api/hello"; // API từ backend

    public HomeController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/")
    public String home(Model model) {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(backendUrl, String.class);
            model.addAttribute("message", response.getBody());
        } catch (Exception e) {
            model.addAttribute("message", "Không thể kết nối đến backend!");
        }
        return "home";
    }
}



