package com.vasyerp.notification.transformer;

import com.vasyerp.notification.dto.response.NotificationResponse;
import com.vasyerp.notification.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationTransformer {

    public NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .message(notification.getMessage())
                .status(notification.getStatus())
                .scheduleTime(notification.getScheduleTime())
                .retryCount(notification.getRetryCount())
                .createdAt(notification.getCreatedAt())
                .build();
    }

}
