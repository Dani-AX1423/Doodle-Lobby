package com.doodlelobby.config;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SocketIOConfig {

    @Value("${room.secret-password:doodlelobby-secret}")
    private String roomSecretPassword;

    @Value("${server.port:${socketio.port:5000}}")
    private int port;

    public String getRoomSecretPassword() {
        return roomSecretPassword;
    }

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname("0.0.0.0");
        config.setPort(port);
        config.setOrigin("*");
        return new SocketIOServer(config);
    }
}