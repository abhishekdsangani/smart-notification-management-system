package com.vasyerp.notification.producer;

import com.vasyerp.notification.queue.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Log4j2
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;

    public void publish(Long notificationId) {
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_QUEUE, notificationId);
            log.info("Published notification {} to queue", notificationId);
        } catch (AmqpException ex) {
            log.error("Failed to publish notification {} to queue - it will stay in its current status until"
                    + " reprocessed", notificationId, ex);
        }
    }

}
