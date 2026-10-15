package com.doodlelobby.config;

import com.doodlelobby.model.Room;
import com.doodlelobby.model.User;
import com.doodlelobby.model.DrawData;
import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service class managing rooms and users in memory.
 * Uses ConcurrentHashMap for thread-safe room storage.
 * Spring-managed bean - no SocketIOServer dependency.
 */
@Component
public class RoomService {

    // In-memory room storage: roomId -> Room
    private final ConcurrentHashMap<String, Room> rooms = new ConcurrentHashMap<>();

    // Color pool for assigned user colors
    private final AtomicLong colorCounter = new AtomicLong(0);

    public String generateRoomId() {
        return "room-" + System.currentTimeMillis() % 100000 + "-" + colorCounter.incrementAndGet();
    }

    public String generateColor() {
        int r = (int) (Math.random() * 256);
        int g = (int) (Math.random() * 256);
        int b = (int) (Math.random() * 256);
        return String.format("#%02x%02x%02x", r, g, b);
    }

    public Room createRoom(String roomId, String roomName, String creatorUsername) {
        return createRoom(roomId, roomName, creatorUsername, "infinite");
    }

    public Room createRoom(String roomId, String roomName, String creatorUsername, String canvasType) {
        Room room = new Room(roomId, roomName, creatorUsername, canvasType);
        rooms.put(roomId, room);
        return room;
    }

    public Room getRoom(String roomId) {
        return rooms.get(roomId);
    }

    public ConcurrentHashMap<String, Room> getAllRooms() {
        return rooms;
    }

    public User createUser(String socketId, String username) {
        String sid = (socketId != null && !socketId.isEmpty()) ? socketId : "anon-" + System.currentTimeMillis();
        return new User(sid, username, generateColor());
    }

    public boolean addUserToRoom(String roomId, User user) {
        Room room = rooms.get(roomId);
        if (room == null || user == null) return false;
        room.addUser(user);
        return true;
    }

    public boolean removeUserFromRoom(String roomId, String socketId) {
        return removeUserFromRoom(roomId, socketId, null);
    }

    public boolean removeUserFromRoom(String roomId, String socketId, Runnable onDestroyed) {
        if (roomId == null || socketId == null) return false;
        Room room = rooms.get(roomId);
        if (room == null) return false;
        User removed = room.removeUser(socketId);
        if (room.getActiveUserCount() == 0) {
            markForDestruction(roomId, onDestroyed);
        }
        return removed != null;
    }

    public int getActiveUserCount(String roomId) {
        Room room = rooms.get(roomId);
        if (room == null) return 0;
        return room.getActiveUserCount();
    }

    public void addDrawData(Room room, byte[] drawData) {
        room.addDrawing(drawData);
    }

    public void clearDrawingHistory(Room room) {
        room.getDrawingHistory().clear();
        room.touch();
    }

    public void touchRoom(String roomId) {
        Room room = rooms.get(roomId);
        if (room != null) {
            room.touch();
        }
    }

    public void destroyRoom(String roomId) {
        rooms.remove(roomId);
    }

    public boolean roomExists(String roomId) {
        return rooms.containsKey(roomId);
    }

    public void markForDestruction(String roomId) {
        markForDestruction(roomId, null);
    }

    public void markForDestruction(String roomId, Runnable onDestroyed) {
        new Thread(() -> {
            try {
                Thread.sleep(120_000); // 2 minutes buffer time
                synchronized (this) {
                    Room room = rooms.get(roomId);
                    if (room != null && room.getActiveUserCount() == 0) {
                        rooms.remove(roomId);
                        System.out.println("Room " + roomId + " destroyed after 2-minute inactivity");
                        if (onDestroyed != null) {
                            try {
                                onDestroyed.run();
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }
}