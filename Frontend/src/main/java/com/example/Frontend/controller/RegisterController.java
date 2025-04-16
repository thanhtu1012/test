package com.example.Frontend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class RegisterController {
    @GetMapping("/Register")
    public String register(Model model) {
        model.addAttribute("message", "Xin chào từ Spring Boot!");
        return "Register";
    }
    @GetMapping("/Enter-OTP")
    public String enterOTP(Model model) {
        model.addAttribute("message", "Xin chào từ Spring Boot!");
        return "Enter-OTP";
    }
}
