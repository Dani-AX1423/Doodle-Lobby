package com.doodlelobby.model;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Represents a whiteboard room with drawing history and users.
 */
public class Room {
    private String roomId;
    private String roomName;
    private String creatorUsername;
    private ConcurrentHashMap<String, User> users; // socketId -> User
    private ConcurrentHashMap<String, byte[]> drawingHistory; // stroke data (JSON bytes)
    private long lastActivity; // timestamp for auto-destruction timer
    private boolean isDestroyed;

    public Room() {
    }

    public Room(String roomId, String roomName, String creatorUsername) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.creatorUsername = creatorUsername;
        this.users = new ConcurrentHashMap<>();
        this.drawingHistory = new ConcurrentHashMap<>();
        this.lastActivity = System.currentTimeMillis();
        this.isDestroyed = false;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getCreatorUsername() {
        return creatorUsername;
    }

    public void setCreatorUsername(String creatorUsername) {
        this.creatorUsername = creatorUsername;
    }

    public ConcurrentHashMap<String, User> getUsers() {
        return users;
    }

    public void addUser(User user) {
        if (user != null && user.getSocketId() != null) {
            // Remove any stale entries for this username so refresh doesn't increment count
            users.entrySet().removeIf(entry -> entry.getValue().getUsername().equalsIgnoreCase(user.getUsername())
                    && !entry.getKey().equals(user.getSocketId()));
            users.put(user.getSocketId(), user);
        }
        lastActivity = System.currentTimeMillis();
    }

    public User removeUser(String socketId) {
        User removed = users.remove(socketId);
        if (removed != null) {
            lastActivity = System.currentTimeMillis();
        }
        return removed;
    }

    public User getUser(String socketId) {
        return users.get(socketId);
    }

    public boolean hasUser(String socketId) {
        return users.containsKey(socketId);
    }

    public int getActiveUserCount() {
        return users.size();
    }

    public ConcurrentHashMap<String, byte[]> getDrawingHistory() {
        return drawingHistory;
    }

    public void addDrawing(byte[] drawData) {
        drawingHistory.put(String.valueOf(System.currentTimeMillis()), drawData);
        lastActivity = System.currentTimeMillis();
    }

    public boolean isDestroyed() {
        return isDestroyed;
    }

    public void setDestroyed(boolean destroyed) {
        isDestroyed = destroyed;
    }

    public long getLastActivity() {
        return lastActivity;
    }

    public void touch() {
        this.lastActivity = System.currentTimeMillis();
    }
}