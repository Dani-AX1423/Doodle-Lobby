package com.doodlelobby.model;

/**
 * Represents a single drawing stroke event with all properties needed for rendering.
 */
public class DrawData {
    private String type; // "line", "rectangle", "circle", "eraser", "clear"
    private int x1, y1, x2, y2;
    private String color;
    private int lineWidth;
    private String username;

    public DrawData() {
    }

    public DrawData(String type, int x1, int y1, int x2, int y2, String color, int lineWidth, String username) {
        this.type = type;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = color;
        this.lineWidth = lineWidth;
        this.username = username;
    }

    // Getters and setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getX1() { return x1; }
    public void setX1(int x1) { this.x1 = x1; }

    public int getY1() { return y1; }
    public void setY1(int y1) { this.y1 = y1; }

    public int getX2() { return x2; }
    public void setX2(int x2) { this.x2 = x2; }

    public int getY2() { return y2; }
    public void setY2(int y2) { this.y2 = y2; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public int getLineWidth() { return lineWidth; }
    public void setLineWidth(int lineWidth) { this.lineWidth = lineWidth; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}