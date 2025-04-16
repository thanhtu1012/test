package com.example.Frontend.controller;

import org.springframework.web.bind.annotation.GetMapping;

public class FogotPasswordController {
    @GetMapping("/ForgotPassword")
    public String forgotPassword() {
        return "ForgotPassword";
    }
}
