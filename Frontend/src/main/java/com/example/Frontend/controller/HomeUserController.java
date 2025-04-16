package com.example.Frontend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeUserController {

    @GetMapping("/Home-User")
    public String homeuser() {
        return "Home-User";
    }

    @GetMapping("/Vaccination")
    public String vaccination() {
        return "Vaccination";
    }
    @GetMapping("/TransferredRecord")
    public String transferredRecord() {
        return "TransferredRecord";
    }
    @GetMapping("/MedicalRecord")
    public String medicalRecord() {
        return "MedicalRecord";
    }
    @GetMapping("/PDF")
    public String pdf() {
        return "PDF";
    }
    @GetMapping("/Notification")
    public String notification() {
        return "Notification";
    }
    @GetMapping("/ChangePass")
    public String changePass() {
        return "ChangePass";
    }

}
