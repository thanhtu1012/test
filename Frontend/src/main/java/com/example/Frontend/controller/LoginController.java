package com.example.Frontend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
@Controller
public class LoginController {

    @GetMapping("/Login")
    public String login(Model model) {
        model.addAttribute("message", "Xin chào từ Spring Boot!");
        return "Login";
    }
    @GetMapping("/ForgotPassword")
    public String forgotPassword(Model model) {
        model.addAttribute("message", "Xin chào từ Spring Boot!");
        return "ForgotPassword";
    }
    @GetMapping("/ResetPassword")
    public String resetPassword(Model model) {
        model.addAttribute("message", "Xin chào từ Spring Boot!");
        return "ResetPassword";
    }
}