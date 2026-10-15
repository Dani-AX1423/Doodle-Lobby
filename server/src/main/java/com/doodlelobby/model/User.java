package com.doodlelobby.model;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Represents a user in a room with socket ID, username, and color.
 */
public class User {
    private String socketId;
    private String username;
    private String color; // Hex color code
    private long lastActivity; // timestamp for idle detection

    public User() {
    }

    public User(String socketId, String username, String color) {
        this.socketId = socketId;
        this.username = username;
        this.color = color;
        this.lastActivity = System.currentTimeMillis();
    }

    public String getSocketId() {
        return socketId;
    }

    public void setSocketId(String socketId) {
        this.socketId = socketId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public long getLastActivity() {
        return lastActivity;
    }

    public void setLastActivity(long lastActivity) {
        this.lastActivity = lastActivity;
    }

    public void touch() {
        this.lastActivity = System.currentTimeMillis();
    }
}