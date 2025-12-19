"""
Stickly Application Architecture Diagram Generator
Generates a professional PNG architecture diagram focusing on application flow
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from matplotlib.patches import ConnectionPatch

# Create figure
fig, ax = plt.subplots(figsize=(18, 14), dpi=300)
ax.set_xlim(0, 12)
ax.set_ylim(0, 16)
ax.axis('off')

# Color scheme
colors = {
    'user': '#4A90E2',
    'frontend': '#E34F26',
    'backend': '#68A063',
    'websocket': '#FF6B6B',
    'storage': '#3498DB',
    'api': '#5FA04E',
    'feature': '#9B59B6',
    'text': '#2C3E50'
}

# Helper function to create boxes
def create_box(ax, x, y, width, height, text, color, style='round', fontsize=9):
    box = FancyBboxPatch(
        (x, y), width, height,
        boxstyle=f"{style},pad=0.1",
        facecolor=color,
        edgecolor='#2C3E50',
        linewidth=2,
        alpha=0.9
    )
    ax.add_patch(box)
    
    # Add text
    lines = text.split('\n')
    y_offset = y + height/2 + (len(lines)-1)*0.12
    for line in lines:
        ax.text(x + width/2, y_offset, line,
                ha='center', va='center',
                fontsize=fontsize, fontweight='bold',
                color='white')
        y_offset -= 0.25

# Helper function to draw arrows
def draw_arrow(ax, x1, y1, x2, y2, label='', style='solid', color='#2C3E50', width=2):
    arrow = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle='->,head_width=0.3,head_length=0.3',
        linestyle=style,
        color=color,
        linewidth=width,
        alpha=0.8
    )
    ax.add_patch(arrow)
    
    if label:
        mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
        # Adjust label position based on arrow direction
        offset = 0.25 if y1 > y2 else 0.2
        ax.text(mid_x + 0.1, mid_y + offset, label,
                ha='center', va='bottom',
                fontsize=7, style='italic',
                bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.9, edgecolor=color))

# Title
ax.text(6, 15.5, 'Stickly Application Architecture',
        ha='center', va='top',
        fontsize=22, fontweight='bold',
        color=colors['text'])
ax.text(6, 15, 'Frontend ↔ Backend Communication & Feature Flow',
        ha='center', va='top',
        fontsize=11, style='italic',
        color='#7F8C8D')

# ===== USER LAYER =====
ax.text(6, 14.2, 'USER LAYER', ha='center', fontsize=10, fontweight='bold', color=colors['text'])
create_box(ax, 4.5, 13, 3, 0.9, 'User\nBrowser/Mobile Device', colors['user'])

# ===== FRONTEND LAYER =====
frontend_box = FancyBboxPatch(
    (0.3, 9.8), 11.4, 2.7,
    boxstyle="round,pad=0.15",
    facecolor=colors['frontend'],
    edgecolor='#2C3E50',
    linewidth=3,
    alpha=0.12
)
ax.add_patch(frontend_box)
ax.text(6, 12.3, 'FRONTEND LAYER (Client-Side)', ha='center', fontsize=11, fontweight='bold', color=colors['frontend'])

# Frontend components
create_box(ax, 0.5, 10.8, 1.8, 0.8, 'HTML/CSS\nUI Components', colors['frontend'], fontsize=8)
create_box(ax, 2.5, 10.8, 1.8, 0.8, 'JavaScript\nEvent Handlers', '#F7DF1E', fontsize=8)
create_box(ax, 4.5, 10.8, 1.8, 0.8, 'LocalStorage\nCache/State', '#9B59B6', fontsize=8)
create_box(ax, 6.5, 10.8, 2.2, 0.8, 'Fetch API\nREST Client', colors['api'], fontsize=8)
create_box(ax, 9, 10.8, 2.5, 0.8, 'Socket.io Client\nWebSocket', colors['websocket'], fontsize=8)

create_box(ax, 0.5, 10, 2.2, 0.6, 'UI: Message Cards\nComments/Reactions', '#E67E22', fontsize=7)
create_box(ax, 3, 10, 2, 0.6, 'Search & Filter\nCategory Toggle', '#3498DB', fontsize=7)
create_box(ax, 5.2, 10, 2, 0.6, 'Dark Mode\nTheme Manager', '#34495E', fontsize=7)
create_box(ax, 7.5, 10, 2, 0.6, 'Image Upload\nFile Handler', '#E74C3C', fontsize=7)
create_box(ax, 9.7, 10, 1.8, 0.6, 'Real-time\nUpdates', colors['websocket'], fontsize=7)

# ===== BACKEND LAYER =====
backend_box = FancyBboxPatch(
    (0.3, 5.5), 11.4, 3.8,
    boxstyle="round,pad=0.15",
    facecolor=colors['backend'],
    edgecolor='#2C3E50',
    linewidth=3,
    alpha=0.12
)
ax.add_patch(backend_box)
ax.text(6, 9.1, 'BACKEND LAYER (Server-Side - Node.js/Express)', ha='center', fontsize=11, fontweight='bold', color=colors['backend'])

# API Endpoints
create_box(ax, 0.5, 7.8, 2.3, 0.9, 'REST API Routes\nExpress Router', colors['api'], fontsize=8)
create_box(ax, 3, 7.8, 2.3, 0.9, 'Middleware\nAuth/Validation', '#F39C12', fontsize=8)
create_box(ax, 5.5, 7.8, 2.8, 0.9, 'Socket.io Server\nWebSocket Handler', colors['websocket'], fontsize=8)
create_box(ax, 8.5, 7.8, 3, 0.9, 'Business Logic\nMessage/Comment/Like', colors['backend'], fontsize=8)

# Specific endpoints
create_box(ax, 0.5, 6.7, 1.8, 0.6, 'POST\n/api/messages', '#27AE60', fontsize=7)
create_box(ax, 2.5, 6.7, 1.8, 0.6, 'GET\n/api/messages', '#3498DB', fontsize=7)
create_box(ax, 4.5, 6.7, 1.8, 0.6, 'PUT\n/api/messages/:id', '#F39C12', fontsize=7)
create_box(ax, 6.5, 6.7, 1.8, 0.6, 'POST\n/api/messages/:id/like', '#E74C3C', fontsize=7)
create_box(ax, 8.5, 6.7, 1.5, 0.6, 'POST\n/comments', '#9B59B6', fontsize=7)
create_box(ax, 10.2, 6.7, 1.3, 0.6, 'POST\n/upload', '#E67E22', fontsize=7)

# WebSocket Events
create_box(ax, 0.5, 5.9, 2.2, 0.6, 'Event: newMessage\nBroadcast', colors['websocket'], fontsize=7)
create_box(ax, 3, 5.9, 2.2, 0.6, 'Event: likesUpdated\nBroadcast', colors['websocket'], fontsize=7)
create_box(ax, 5.5, 5.9, 2.2, 0.6, 'Event: newComment\nBroadcast', colors['websocket'], fontsize=7)
create_box(ax, 8, 5.9, 1.8, 0.6, 'Event: messageUpdated', colors['websocket'], fontsize=7)
create_box(ax, 10, 5.9, 1.5, 0.6, 'Active Users\nCounter', colors['websocket'], fontsize=7)

# ===== DATA LAYER =====
data_box = FancyBboxPatch(
    (0.3, 3.8), 11.4, 1.3,
    boxstyle="round,pad=0.15",
    facecolor=colors['storage'],
    edgecolor='#2C3E50',
    linewidth=3,
    alpha=0.12
)
ax.add_patch(data_box)
ax.text(6, 5, 'DATA LAYER (In-Memory Storage)', ha='center', fontsize=11, fontweight='bold', color=colors['storage'])

create_box(ax, 0.8, 4, 2.5, 0.7, 'messages[]\nArray of Objects', colors['storage'], fontsize=8)
create_box(ax, 3.5, 4, 2.5, 0.7, 'adminSessions\nSet', '#34495E', fontsize=8)
create_box(ax, 6.2, 4, 2.5, 0.7, 'Image Data\nBase64 Encoded', '#E67E22', fontsize=8)
create_box(ax, 9, 4, 2.5, 0.7, 'Session State\nIn-Memory', '#95A5A6', fontsize=8)

# ===== FEATURE FLOWS =====
ax.text(6, 3.4, 'KEY FEATURE FLOWS', ha='center', fontsize=11, fontweight='bold', color=colors['text'])

# Feature 1: Create Message
flow1_box = FancyBboxPatch(
    (0.3, 0.4), 3.5, 2.7,
    boxstyle="round,pad=0.1",
    facecolor='#ECF0F1',
    edgecolor=colors['feature'],
    linewidth=2,
    alpha=0.3
)
ax.add_patch(flow1_box)
ax.text(2.05, 2.95, '1. Create Message Flow', ha='center', fontsize=9, fontweight='bold', color=colors['feature'])
ax.text(2.05, 2.65, '① User fills form & clicks Post', ha='left', fontsize=7, color=colors['text'])
ax.text(2.05, 2.4, '② Frontend validates input', ha='left', fontsize=7, color=colors['text'])
ax.text(2.05, 2.15, '③ POST /api/messages (JSON)', ha='left', fontsize=7, color=colors['text'])
ax.text(2.05, 1.9, '④ Backend validates & saves', ha='left', fontsize=7, color=colors['text'])
ax.text(2.05, 1.65, '⑤ Emit "newMessage" via Socket', ha='left', fontsize=7, color=colors['text'])
ax.text(2.05, 1.4, '⑥ All clients receive event', ha='left', fontsize=7, color=colors['text'])
ax.text(2.05, 1.15, '⑦ Frontend appends to DOM', ha='left', fontsize=7, color=colors['text'])
ax.text(2.05, 0.9, '⑧ Smooth animation appears', ha='left', fontsize=7, color=colors['text'])
ax.text(2.05, 0.65, '✓ Message visible to all users', ha='left', fontsize=7, fontweight='bold', color='#27AE60')

# Feature 2: Like/React
flow2_box = FancyBboxPatch(
    (4.1, 0.4), 3.5, 2.7,
    boxstyle="round,pad=0.1",
    facecolor='#ECF0F1',
    edgecolor=colors['feature'],
    linewidth=2,
    alpha=0.3
)
ax.add_patch(flow2_box)
ax.text(5.85, 2.95, '2. Like/Reaction Flow', ha='center', fontsize=9, fontweight='bold', color=colors['feature'])
ax.text(5.85, 2.65, '① User clicks like/emoji button', ha='left', fontsize=7, color=colors['text'])
ax.text(5.85, 2.4, '② Check LocalStorage for state', ha='left', fontsize=7, color=colors['text'])
ax.text(5.85, 2.15, '③ POST /api/messages/:id/like', ha='left', fontsize=7, color=colors['text'])
ax.text(5.85, 1.9, '④ Backend updates count', ha='left', fontsize=7, color=colors['text'])
ax.text(5.85, 1.65, '⑤ Emit "likesUpdated" event', ha='left', fontsize=7, color=colors['text'])
ax.text(5.85, 1.4, '⑥ All clients update counter', ha='left', fontsize=7, color=colors['text'])
ax.text(5.85, 1.15, '⑦ Button highlights (visual)', ha='left', fontsize=7, color=colors['text'])
ax.text(5.85, 0.9, '⑧ Save state to LocalStorage', ha='left', fontsize=7, color=colors['text'])
ax.text(5.85, 0.65, '✓ Real-time sync across users', ha='left', fontsize=7, fontweight='bold', color='#27AE60')

# Feature 3: Comment
flow3_box = FancyBboxPatch(
    (7.9, 0.4), 3.8, 2.7,
    boxstyle="round,pad=0.1",
    facecolor='#ECF0F1',
    edgecolor=colors['feature'],
    linewidth=2,
    alpha=0.3
)
ax.add_patch(flow3_box)
ax.text(9.8, 2.95, '3. Comment Flow', ha='center', fontsize=9, fontweight='bold', color=colors['feature'])
ax.text(9.8, 2.65, '① User clicks comment button', ha='left', fontsize=7, color=colors['text'])
ax.text(9.8, 2.4, '② GET /api/messages/:id/comments', ha='left', fontsize=7, color=colors['text'])
ax.text(9.8, 2.15, '③ Display comment section', ha='left', fontsize=7, color=colors['text'])
ax.text(9.8, 1.9, '④ User types & submits comment', ha='left', fontsize=7, color=colors['text'])
ax.text(9.8, 1.65, '⑤ POST /api/messages/:id/comments', ha='left', fontsize=7, color=colors['text'])
ax.text(9.8, 1.4, '⑥ Backend saves to message object', ha='left', fontsize=7, color=colors['text'])
ax.text(9.8, 1.15, '⑦ Emit "newComment" Socket event', ha='left', fontsize=7, color=colors['text'])
ax.text(9.8, 0.9, '⑧ All clients append comment', ha='left', fontsize=7, color=colors['text'])
ax.text(9.8, 0.65, '✓ Nested conversation appears', ha='left', fontsize=7, fontweight='bold', color='#27AE60')

# ===== CONNECTION ARROWS =====
# User to Frontend
draw_arrow(ax, 6, 13, 6, 11.7, 'User Actions', color=colors['user'], width=2.5)

# Frontend to Backend (REST API)
draw_arrow(ax, 7.5, 10.8, 8, 8.7, 'HTTP\nREST API', color=colors['api'], width=2)
draw_arrow(ax, 8, 8.7, 7.5, 10.8, 'JSON\nResponse', style='dashed', color=colors['api'])

# Frontend to Backend (WebSocket)
draw_arrow(ax, 10.2, 10.8, 6.9, 8.3, 'Connect\nWebSocket', color=colors['websocket'], width=2)
draw_arrow(ax, 6.9, 8.3, 10.2, 10.8, 'Real-time\nEvents', style='dashed', color=colors['websocket'], width=2)

# Backend to Data
draw_arrow(ax, 6, 7.8, 6, 4.7, 'Read/Write', color=colors['storage'], width=2)
draw_arrow(ax, 6.5, 4.7, 6.5, 7.8, 'Data', style='dashed', color=colors['storage'])

# LocalStorage connection
draw_arrow(ax, 5.4, 10.8, 5.4, 10, 'Store', style='dotted', color='#9B59B6')

# Add legend
legend_elements = [
    mpatches.Patch(facecolor=colors['frontend'], label='Frontend (Client)'),
    mpatches.Patch(facecolor=colors['backend'], label='Backend (Server)'),
    mpatches.Patch(facecolor=colors['api'], label='REST API'),
    mpatches.Patch(facecolor=colors['websocket'], label='WebSocket'),
    mpatches.Patch(facecolor=colors['storage'], label='Data Storage'),
]
ax.legend(handles=legend_elements, loc='upper right', fontsize=8, framealpha=0.95, ncol=2)

# Add note
note_text = "Note: WebSocket provides real-time bidirectional communication.\nAll connected clients receive updates instantly."
ax.text(0.5, 0.15, note_text,
        ha='left', va='bottom',
        fontsize=7, style='italic',
        bbox=dict(boxstyle='round,pad=0.5', facecolor='#FFF9E6', alpha=0.9, edgecolor='#F39C12'),
        color='#7F8C8D')

# Save
plt.tight_layout()
plt.savefig('stickly_app_architecture.png', dpi=300, bbox_inches='tight', facecolor='white')
print("✅ Application architecture diagram generated: stickly_app_architecture.png")
plt.close()
