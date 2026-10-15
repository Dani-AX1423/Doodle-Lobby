package com.doodlelobby.socket;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.doodlelobby.config.RoomService;
import com.doodlelobby.model.Room;
import com.doodlelobby.model.User;
import com.google.gson.Gson;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class SocketModule {

    private final SocketIOServer server;
    private final RoomService roomService;
    private final Gson gson = new Gson();

    public SocketModule(SocketIOServer server, RoomService roomService) {
        this.server = server;
        this.roomService = roomService;
    }

    @PostConstruct
    public void startServer() {
        registerListeners();
        server.start();
        System.out.println("Socket.IO Server started successfully on port " + server.getConfiguration().getPort());
    }

    @PreDestroy
    public void stopServer() {
        if (server != null) {
            server.stop();
            System.out.println("Socket.IO Server stopped.");
        }
    }

    private void registerListeners() {
        server.addConnectListener(onConnected());
        server.addDisconnectListener(onDisconnected());

        server.addEventListener("get-rooms", Object.class, onGetRooms());
        server.addEventListener("create-room", Object.class, onCreateRoom());
        server.addEventListener("join-room", Object.class, onJoinRoom());
        server.addEventListener("leave-room", Object.class, onLeaveRoom());
        server.addEventListener("draw-event", Object.class, onDrawEvent());
        server.addEventListener("cursor-move", Object.class, onCursorMove());
        server.addEventListener("clear-canvas", Object.class, onClearCanvas());
    }

    private ConnectListener onConnected() {
        return client -> {
            System.out.println("Client connected: " + client.getSessionId());
            client.sendEvent("get-rooms", getFormattedRooms());
        };
    }

    private DisconnectListener onDisconnected() {
        return client -> {
            String roomId = client.get("roomId");
            String username = client.get("username");
            System.out.println("Client disconnected: " + client.getSessionId() + " from room: " + roomId);
            if (roomId != null) {
                handleDisconnect(roomId, client.getSessionId().toString());
                server.getRoomOperations(roomId).sendEvent("user-left", username != null ? username : "User");
                broadcastRooms();
            }
        };
    }

    private DataListener<Object> onGetRooms() {
        return (client, data, ackSender) -> {
            client.sendEvent("get-rooms", getFormattedRooms());
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Object> onCreateRoom() {
        return (client, data, ackSender) -> {
            String roomName = "Untitled Room";
            String username = "Creator";

            if (data instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) data;
                if (map.get("roomName") != null) roomName = map.get("roomName").toString();
                if (map.get("username") != null) username = map.get("username").toString();
            } else if (data instanceof String) {
                try {
                    Map<String, Object> map = gson.fromJson((String) data, Map.class);
                    if (map != null) {
                        if (map.get("roomName") != null) roomName = map.get("roomName").toString();
                        if (map.get("username") != null) username = map.get("username").toString();
                    }
                } catch (Exception ignored) {}
            }

            Room room = createRoom(roomName, username, client.getSessionId().toString());
            String roomId = room.getRoomId();

            client.set("roomId", roomId);
            client.set("username", username);
            client.joinRoom(roomId);

            User user = room.getUser(client.getSessionId().toString());
            String color = user != null ? user.getColor() : generateColor();

            Map<String, Object> response = Map.of(
                    "roomId", roomId,
                    "roomName", room.getRoomName(),
                    "username", username,
                    "color", color
            );

            client.sendEvent("room-created", response);
            server.getRoomOperations(roomId).sendEvent("user-joined", username + "|" + color);
            broadcastRooms();
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Object> onJoinRoom() {
        return (client, data, ackSender) -> {
            String roomId = null;
            String username = "Guest";

            if (data instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) data;
                if (map.get("roomId") != null) roomId = map.get("roomId").toString();
                if (map.get("username") != null) username = map.get("username").toString();
            } else if (data instanceof String) {
                try {
                    Map<String, Object> map = gson.fromJson((String) data, Map.class);
                    if (map != null) {
                        if (map.get("roomId") != null) roomId = map.get("roomId").toString();
                        if (map.get("username") != null) username = map.get("username").toString();
                    } else {
                        roomId = (String) data;
                    }
                } catch (Exception e) {
                    roomId = (String) data;
                }
            }

            if (roomId == null) return;

            Room room = roomService.getRoom(roomId);
            if (room == null) {
                client.sendEvent("error", "Room does not exist");
                return;
            }

            client.set("roomId", roomId);
            client.set("username", username);
            client.joinRoom(roomId);

            User user = joinRoom(roomId, username, client.getSessionId().toString());
            String color = user != null ? user.getColor() : generateColor();

            // Send existing drawing history to the joining client
            for (byte[] stroke : room.getDrawingHistory().values()) {
                client.sendEvent("draw-event", new String(stroke, StandardCharsets.UTF_8));
            }

            // Notify everyone in the room (including joiner)
            server.getRoomOperations(roomId).sendEvent("user-joined", username + "|" + color);
            broadcastRooms();
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Object> onLeaveRoom() {
        return (client, data, ackSender) -> {
            String roomId = client.get("roomId");
            String username = client.get("username");

            if (data instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) data;
                if (map.get("roomId") != null) roomId = map.get("roomId").toString();
            }

            if (roomId != null) {
                handleDisconnect(roomId, client.getSessionId().toString());
                client.leaveRoom(roomId);
                client.del("roomId");
                server.getRoomOperations(roomId).sendEvent("user-left", username != null ? username : "User");
                broadcastRooms();
            }
        };
    }

    private DataListener<Object> onDrawEvent() {
        return (client, data, ackSender) -> {
            String roomId = client.get("roomId");
            if (roomId == null) return;

            Room room = roomService.getRoom(roomId);
            if (room == null) return;

            String drawJson;
            if (data instanceof String) {
                drawJson = (String) data;
            } else {
                drawJson = gson.toJson(data);
            }

            try {
                Map<String, Object> map = gson.fromJson(drawJson, Map.class);
                if (map != null) {
                    String eventType = map.get("type") != null ? map.get("type").toString() : "";
                    String strokeId = map.get("strokeId") != null ? map.get("strokeId").toString() : null;

                    if ("undo".equals(eventType) && strokeId != null) {
                        room.getDrawingHistory().remove(strokeId);
                        room.touch();
                    } else if (Boolean.FALSE.equals(map.get("isStreaming")) || map.get("isStreaming") == null) {
                        // Only save non-streaming finalized strokes to history
                        String key = strokeId != null ? strokeId : String.valueOf(System.currentTimeMillis());
                        room.getDrawingHistory().put(key, drawJson.getBytes(StandardCharsets.UTF_8));
                        room.touch();
                    }
                } else {
                    drawEvent(room, drawJson.getBytes(StandardCharsets.UTF_8), client.get("username"));
                }
            } catch (Exception e) {
                drawEvent(room, drawJson.getBytes(StandardCharsets.UTF_8), client.get("username"));
            }

            // Broadcast to other clients in room (including live streaming points and undo)
            for (SocketIOClient c : server.getRoomOperations(roomId).getClients()) {
                if (!c.getSessionId().equals(client.getSessionId())) {
                    c.sendEvent("draw-event", drawJson);
                }
            }
        };
    }

    private DataListener<Object> onCursorMove() {
        return (client, data, ackSender) -> {
            String roomId = client.get("roomId");
            if (roomId == null) return;

            Room room = roomService.getRoom(roomId);
            if (room != null) {
                cursorMove(room, client.get("username"), null);
            }

            // Broadcast cursor to other clients in room
            for (SocketIOClient c : server.getRoomOperations(roomId).getClients()) {
                if (!c.getSessionId().equals(client.getSessionId())) {
                    c.sendEvent("cursor-move", data);
                }
            }
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Object> onClearCanvas() {
        return (client, data, ackSender) -> {
            String roomId = client.get("roomId");
            if (data instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) data;
                if (map.get("roomId") != null) roomId = map.get("roomId").toString();
            }

            if (roomId == null) return;

            Room room = roomService.getRoom(roomId);
            if (room != null) {
                clearCanvas(room);
                server.getRoomOperations(roomId).sendEvent("clear-canvas", roomId);
            }
        };
    }

    public void broadcastRooms() {
        server.getBroadcastOperations().sendEvent("get-rooms", getFormattedRooms());
    }

    public String getFormattedRooms() {
        return roomService.getAllRooms().values().stream()
                .filter(r -> !r.isDestroyed())
                .map(r -> r.getRoomId() + "|" + r.getRoomName() + "|" + r.getActiveUserCount() + "|" + r.getCreatorUsername())
                .collect(Collectors.joining(";"));
    }

    public boolean verifyPassword(String password) {
        return "doodlelobby-secret".equals(password);
    }

    public String generateRoomId() {
        return roomService.generateRoomId();
    }

    public String generateColor() {
        return roomService.generateColor();
    }

    public Room createRoom(String roomName, String username, String socketId) {
        String roomId = generateRoomId();
        Room room = roomService.createRoom(roomId, roomName, username);
        if (socketId != null) {
            User creator = roomService.createUser(socketId, username);
            roomService.addUserToRoom(roomId, creator);
        }
        return room;
    }

    public Room createRoom(String roomName, String username) {
        return createRoom(roomName, username, null);
    }

    public User joinRoom(String roomId, String username, String socketId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return null;
        User newUser = roomService.createUser(socketId, username);
        roomService.addUserToRoom(roomId, newUser);
        roomService.touchRoom(roomId);
        return newUser;
    }

    public void drawEvent(Room room, byte[] drawData, String username) {
        roomService.addDrawData(room, drawData);
        roomService.touchRoom(room.getRoomId());
    }

    public void cursorMove(Room room, String username, String userColor) {
        roomService.touchRoom(room.getRoomId());
    }

    public void clearCanvas(Room room) {
        roomService.clearDrawingHistory(room);
    }

    public void handleDisconnect(String roomId, String socketId) {
        roomService.removeUserFromRoom(roomId, socketId, this::broadcastRooms);
    }

    public void scheduleRoomDestroy(String roomId) {
        roomService.markForDestruction(roomId, this::broadcastRooms);
    }
}