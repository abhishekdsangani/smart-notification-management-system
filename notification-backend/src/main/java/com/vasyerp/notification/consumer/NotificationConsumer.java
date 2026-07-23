package com.vasyerp.notification.consumer;

import com.vasyerp.notification.constant.NotificationConstants;
import com.vasyerp.notification.enums.NotificationStatus;
import com.vasyerp.notification.queue.RabbitMQConfig;
import com.vasyerp.notification.repository.NotificationRepository;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Log4j2
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    @Transactional
    public void processNotification(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresentOrElse(notification -> {
            boolean simulatedFailure = ThreadLocalRandom.current().nextDouble() < NotificationConstants.RANDOM_FAILURE_RATE;
            notification.setStatus(simulatedFailure ? NotificationStatus.FAILED : NotificationStatus.SENT);
            notificationRepository.save(notification);
            log.info("Processed notification {} -> {}", notificationId, notification.getStatus());
        }, () -> log.warn("Received message for unknown notification id {}", notificationId));
    }

}
