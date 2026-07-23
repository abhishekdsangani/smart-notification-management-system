package com.vasyerp.notification.controller;

import com.vasyerp.notification.dto.response.DashboardResponse;
import com.vasyerp.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final NotificationService notificationService;

    @GetMapping
    public DashboardResponse dashboard() {
        return notificationService.dashboard();
    }
}
