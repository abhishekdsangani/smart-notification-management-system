package com.vasyerp.notification.dto.response;

import com.vasyerp.notification.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DashboardResponse {

    private long totalNotifications;
    private long sentCount;
    private long failedCount;
    private long retryCount;
    private Map<NotificationType, Long> typeWiseStats;
}