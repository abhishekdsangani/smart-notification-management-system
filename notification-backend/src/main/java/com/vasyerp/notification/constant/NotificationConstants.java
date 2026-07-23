package com.vasyerp.notification.constant;

public interface NotificationConstants {

    int MAX_RETRY_ATTEMPTS = 3;
    long RETRY_COOLDOWN_MINUTES = 2;
    long DUPLICATE_WINDOW_MINUTES = 5;
    int MAX_WORD_REPETITION = 3;
    double RANDOM_FAILURE_RATE = 0.3;
}