package com.learnsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * Async thread pool for post-submission work (analytics, streak, XP).
 *
 * After a user submits code, the submission is saved and the HTTP response is
 * returned immediately. Analytics, streak updates, and SRS enqueue happen
 * asynchronously in this pool — the user never waits for them.
 *
 * Sizing:
 *   core=10  — always-ready threads for burst traffic
 *   max=30   — grows under sustained load
 *   queue=500 — buffers up to 500 pending tasks before rejecting
 *   CallerRunsPolicy — if queue fills, the calling thread does the work
 *                      (graceful degradation back to sync, never drops tasks)
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "submissionAsync")
    public Executor submissionAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(30);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("sub-async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
