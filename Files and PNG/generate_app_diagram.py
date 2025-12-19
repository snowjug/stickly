"""
Stickly Application Architecture Diagram - Simplified
Shows frontend-backend communication and feature flows
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

# Create figure with white background
fig = plt.figure(figsize=(20, 14), facecolor='white', dpi=300)
ax = fig.add_subplot(111)
ax.set_xlim(0, 20)
ax.set_ylim(0, 14)
ax.axis('off')

# Colors
COL_USER = '#4A90E2'
COL_FRONT = '#E34F26'
COL_BACK = '#68A063'
COL_WS = '#FF6B6B'
COL_DATA = '#3498DB'
COL_API = '#5FA04E'

def box(x, y, w, h, txt, col, fs=9):
    """Create a colored box with text"""
    rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08",
                          facecolor=col, edgecolor='#2C3E50', linewidth=2, alpha=0.9)
    ax.add_patch(rect)
    ax.text(x+w/2, y+h/2, txt, ha='center', va='center',
            fontsize=fs, fontweight='bold', color='white', wrap=True)

def arrow(x1, y1, x2, y2, lbl='', col='#2C3E50', sty='solid'):
    """Draw arrow with optional label"""
    arr = FancyArrowPatch((x1, y1), (x2, y2),
                          arrowstyle='->,head_width=0.25,head_length=0.25',
                          linestyle=sty, color=col, linewidth=2.5, alpha=0.8)
    ax.add_patch(arr)
    if lbl:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my+0.15, lbl, ha='center', va='bottom', fontsize=8,
                style='italic', bbox=dict(boxstyle='round,pad=0.25',
                facecolor='white', alpha=0.9, edgecolor=col))

# Title
ax.text(10, 13.5, 'Stickly Application Architecture', ha='center',
        fontsize=24, fontweight='bold', color='#2C3E50')
ax.text(10, 12.8, 'Frontend ↔ Backend Communication & Data Flow',
        ha='center', fontsize=12, style='italic', color='#7F8C8D')

# USER LAYER
ax.text(10, 12.2, 'USER', ha='center', fontsize=10, fontweight='bold')
box(8.5, 11, 3, 0.8, 'Users\n(Browser/Mobile)', COL_USER)

# FRONTEND LAYER
bg1 = FancyBboxPatch((0.3, 8.8), 19.4, 1.8, boxstyle="round,pad=0.1",
                     facecolor=COL_FRONT, edgecolor='#2C3E50',
                     linewidth=2, alpha=0.1)
ax.add_patch(bg1)
ax.text(10, 10.5, 'FRONTEND (Client-Side JavaScript)', ha='center',
        fontsize=11, fontweight='bold', color=COL_FRONT)

box(0.5, 9, 2.3, 0.6, 'HTML/CSS\nUI', COL_FRONT, 8)
box(3, 9, 2.3, 0.6, 'JavaScript\nLogic', '#F7DF1E', 8)
box(5.5, 9, 2.3, 0.6, 'LocalStorage\nState', '#9B59B6', 8)
box(8, 9, 2.8, 0.6, 'Fetch API\nREST Client', COL_API, 8)
box(11, 9, 3.2, 0.6, 'Socket.io Client\nWebSocket', COL_WS, 8)
box(14.5, 9, 2.5, 0.6, 'Image Upload\nHandler', '#E67E22', 8)
box(17.2, 9, 2.5, 0.6, 'Search/Filter\nUI Logic', '#3498DB', 8)

# BACKEND LAYER
bg2 = FancyBboxPatch((0.3, 5), 19.4, 3.3, boxstyle="round,pad=0.1",
                     facecolor=COL_BACK, edgecolor='#2C3E50',
                     linewidth=2, alpha=0.1)
ax.add_patch(bg2)
ax.text(10, 8.2, 'BACKEND (Node.js + Express.js)', ha='center',
        fontsize=11, fontweight='bold', color=COL_BACK)

# Express/Middleware
box(0.5, 6.8, 2.8, 0.8, 'Express.js\nRouter', COL_API, 8)
box(3.5, 6.8, 2.8, 0.8, 'Middleware\nAuth/Validate', '#F39C12', 8)
box(6.5, 6.8, 3.2, 0.8, 'Socket.io Server\nWebSocket', COL_WS, 8)
box(10, 6.8, 3, 0.8, 'Business Logic\nControllers', COL_BACK, 8)
box(13.2, 6.8, 3.3, 0.8, 'Message Service\nComment/Like', '#2ECC71', 8)
box(16.7, 6.8, 3, 0.8, 'Image Processing\nBase64', '#E67E22', 8)

# API Endpoints
box(0.5, 5.6, 1.9, 0.6, 'POST\n/messages', '#27AE60', 7)
box(2.5, 5.6, 1.9, 0.6, 'GET\n/messages', '#3498DB', 7)
box(4.5, 5.6, 1.9, 0.6, 'PUT\n/messages/:id', '#F39C12', 7)
box(6.5, 5.6, 1.9, 0.6, 'POST\n/:id/like', '#E74C3C', 7)
box(8.5, 5.6, 1.9, 0.6, 'POST\n/:id/comments', '#9B59B6', 7)
box(10.5, 5.6, 1.9, 0.6, 'POST\n/upload', '#E67E22', 7)
box(12.5, 5.6, 1.9, 0.6, 'POST\n/:id/react', '#FF6B6B', 7)
box(14.5, 5.6, 1.9, 0.6, 'DELETE\n/messages/:id', '#C0392B', 7)
box(16.5, 5.6, 1.8, 0.6, 'POST\n/admin/login', '#34495E', 7)
box(18.5, 5.6, 1.2, 0.6, '/metrics', '#E6522C', 7)

# WebSocket Events
box(0.5, 5.1, 2.8, 0.4, 'emit: newMessage', COL_WS, 7)
box(3.5, 5.1, 2.8, 0.4, 'emit: likesUpdated', COL_WS, 7)
box(6.5, 5.1, 2.8, 0.4, 'emit: newComment', COL_WS, 7)
box(9.5, 5.1, 2.8, 0.4, 'emit: messageUpdated', COL_WS, 7)
box(12.5, 5.1, 2.8, 0.4, 'emit: messageDeleted', COL_WS, 7)
box(15.5, 5.1, 2.3, 0.4, 'emit: activeUsers', COL_WS, 7)

# DATA LAYER
bg3 = FancyBboxPatch((0.3, 3), 19.4, 1.5, boxstyle="round,pad=0.1",
                     facecolor=COL_DATA, edgecolor='#2C3E50',
                     linewidth=2, alpha=0.1)
ax.add_patch(bg3)
ax.text(10, 4.4, 'DATA LAYER (In-Memory Storage)', ha='center',
        fontsize=11, fontweight='bold', color=COL_DATA)

box(1, 3.2, 3.5, 0.8, 'messages: Array[]\nAll posted messages', COL_DATA, 8)
box(4.8, 3.2, 3.5, 0.8, 'adminSessions: Set\nActive admin sessions', '#34495E', 8)
box(8.6, 3.2, 3.5, 0.8, 'imageData: Base64\nUploaded images', '#E67E22', 8)
box(12.4, 3.2, 3.5, 0.8, 'comments: Nested[]\nComment threads', '#9B59B6', 8)
box(16.2, 3.2, 3.5, 0.8, 'likes/reactions: Map\nEngagement data', '#E74C3C', 8)

# FEATURE FLOWS
ax.text(10, 2.6, 'KEY FEATURE FLOWS (User Journey)', ha='center',
        fontsize=11, fontweight='bold', color='#2C3E50')

# Flow 1: Post Message
flow1 = FancyBboxPatch((0.3, 0.3), 4.7, 2.1, boxstyle="round,pad=0.08",
                       facecolor='#FFF3E0', edgecolor='#FF9800',
                       linewidth=2, alpha=0.7)
ax.add_patch(flow1)
ax.text(2.65, 2.3, '1️⃣ POST MESSAGE FLOW', ha='center', fontsize=9,
        fontweight='bold', color='#E65100')
txt1 = """① User fills form & clicks "Post"
② Frontend validates (500 char limit)
③ Fetch: POST /api/messages + JSON
④ Backend creates message object
⑤ Save to messages[] array
⑥ Socket.emit('newMessage', data)
⑦ All clients receive & render
✓ Message appears for everyone"""
ax.text(0.5, 1.9, txt1, ha='left', va='top', fontsize=7, family='monospace')

# Flow 2: Like/React
flow2 = FancyBboxPatch((5.2, 0.3), 4.7, 2.1, boxstyle="round,pad=0.08",
                       facecolor='#FCE4EC', edgecolor='#E91E63',
                       linewidth=2, alpha=0.7)
ax.add_patch(flow2)
ax.text(7.55, 2.3, '2️⃣ LIKE/REACTION FLOW', ha='center', fontsize=9,
        fontweight='bold', color='#880E4F')
txt2 = """① User clicks like/emoji button
② Check LocalStorage state
③ Fetch: POST /api/messages/:id/like
④ Backend updates like count
⑤ Socket.emit('likesUpdated')
⑥ All clients update counter
⑦ Button highlights (visual)
✓ Real-time sync to all users"""
ax.text(5.4, 1.9, txt2, ha='left', va='top', fontsize=7, family='monospace')

# Flow 3: Comment
flow3 = FancyBboxPatch((10.1, 0.3), 4.7, 2.1, boxstyle="round,pad=0.08",
                       facecolor='#E8EAF6', edgecolor='#3F51B5',
                       linewidth=2, alpha=0.7)
ax.add_patch(flow3)
ax.text(12.45, 2.3, '3️⃣ COMMENT FLOW', ha='center', fontsize=9,
        fontweight='bold', color='#1A237E')
txt3 = """① User clicks comment button
② GET /api/messages/:id/comments
③ Display comment section
④ User types & submits (200 char)
⑤ POST /api/messages/:id/comments
⑥ Backend saves to message.comments[]
⑦ Socket.emit('newComment')
✓ Comment appears for all"""
ax.text(10.3, 1.9, txt3, ha='left', va='top', fontsize=7, family='monospace')

# Flow 4: Real-time Updates
flow4 = FancyBboxPatch((15, 0.3), 4.7, 2.1, boxstyle="round,pad=0.08",
                       facecolor='#FFEBEE', edgecolor='#F44336',
                       linewidth=2, alpha=0.7)
ax.add_patch(flow4)
ax.text(17.35, 2.3, '4️⃣ REAL-TIME UPDATES', ha='center', fontsize=9,
        fontweight='bold', color='#B71C1C')
txt4 = """① Client connects via WebSocket
② Server tracks active connections
③ On data change (POST/PUT/DELETE)
④ Server emits event to all clients
⑤ Clients listen for events
⑥ Auto-update DOM without refresh
⑦ Bidirectional communication
✓ Instant synchronization"""
ax.text(15.2, 1.9, txt4, ha='left', va='top', fontsize=7, family='monospace')

# CONNECTION ARROWS
# User to Frontend
arrow(10, 11, 10, 10.6, 'User Actions', COL_USER, 'solid')

# Frontend to Backend (REST)
arrow(9.2, 9, 9.5, 7.6, 'HTTP REST', COL_API, 'solid')
arrow(10.5, 7.6, 10.8, 9, 'JSON Response', COL_API, 'dashed')

# Frontend to Backend (WebSocket)
arrow(12, 9, 7.5, 7.6, 'Connect WebSocket', COL_WS, 'solid')
arrow(7.5, 7.6, 11.5, 9, 'Real-time Events', COL_WS, 'dashed')

# Backend to Data
arrow(10, 6.8, 10, 4.0, 'CRUD', COL_DATA, 'solid')
arrow(10.3, 4.0, 10.3, 6.8, 'Read Data', COL_DATA, 'dotted')

# Legend
legend_patches = [
    mpatches.Patch(facecolor=COL_FRONT, label='Frontend (Client)'),
    mpatches.Patch(facecolor=COL_BACK, label='Backend (Server)'),
    mpatches.Patch(facecolor=COL_API, label='REST API'),
    mpatches.Patch(facecolor=COL_WS, label='WebSocket (Real-time)'),
    mpatches.Patch(facecolor=COL_DATA, label='Data Storage'),
]
ax.legend(handles=legend_patches, loc='upper left', fontsize=9,
          framealpha=0.95, ncol=3, title='Components', title_fontsize=10)

# Note
note = """📌 KEY POINTS:
• REST API for CRUD operations (Create, Read, Update, Delete)
• WebSocket (Socket.io) for real-time bidirectional communication
• LocalStorage for client-side state (theme, likes)
• In-memory storage means data is lost on server restart
• All connected clients receive updates instantly"""
ax.text(19.7, 0.5, note, ha='right', va='bottom', fontsize=7,
        bbox=dict(boxstyle='round,pad=0.4', facecolor='#FFF9E6',
                 alpha=0.95, edgecolor='#F39C12', linewidth=2),
        family='monospace', color='#5D4037')

plt.tight_layout()
plt.savefig('stickly_app_architecture.png', dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none')
print("✅ Application architecture diagram generated: stickly_app_architecture.png")
print("   📊 Shows: Frontend-Backend communication, API endpoints, WebSocket events, and feature flows")
plt.close()
