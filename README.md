# Stickly 💬

> **Your secrets are safe here**

A modern, interactive anonymous message board where users can share their thoughts, inspirations, knowledge, and confessions with the world. Built with a sleek Apple-inspired design featuring draggable message cards, smooth animations, and a fully responsive interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![Express](https://img.shields.io/badge/express-4.18.2-lightgrey.svg)

## ✨ Features

- **Anonymous Posting** - Share messages without revealing your identity
- **Category System** - Organize messages into 4 categories:
  - ✨ Inspiration
  - 📚 Knowledge
  - 💭 Thoughts
  - 🤫 Confessions
- **Draggable Cards** - Click and drag message cards anywhere on the page
- **Dark Mode** - Toggle between light and dark themes with localStorage persistence
- **Interactive Animations**
  - Confetti celebration on post
  - 3D tilt effects on hover
  - Hanging/swaying card animations
  - Custom blinking cursor
- **Responsive Design** - Fully optimized for mobile and desktop
- **Section-Specific Quotes** - Dynamic inspirational quotes at the bottom
- **Glassmorphism UI** - Modern glass-like effects throughout

## 🚀 Quick Start

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Devops
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   ```
   Navigate to http://localhost:3000
   ```

## 🏗️ Architecture

```
Devops/
│
├── server.js           # Express server & API endpoints
├── package.json        # Project dependencies & scripts
│
└── public/
    ├── index.html      # Main HTML structure
    ├── style.css       # Styles & animations
    └── (assets)        # Static files served by Express
```

### System Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTP Requests
       │
┌──────▼──────┐
│   Express   │
│   Server    │
│  (Port 3000)│
└──────┬──────┘
       │
       │ In-Memory
       │
┌──────▼──────┐
│  Messages   │
│    Array    │
└─────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** (v4.18.2) - Web application framework
- **In-Memory Storage** - Message array (resets on server restart)

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with:
  - CSS Custom Properties (variables)
  - Flexbox & Grid layouts
  - Glassmorphism effects (backdrop-filter)
  - Keyframe animations
  - Media queries for responsiveness
- **Vanilla JavaScript** - No frameworks, pure DOM manipulation

### Features Implementation
- **Dark Mode** - CSS custom properties + localStorage API
- **Drag & Drop** - Mouse events (mousedown, mousemove, mouseup)
- **Animations** - CSS @keyframes + RequestAnimationFrame
- **Confetti** - Dynamic DOM element creation
- **3D Effects** - CSS transforms & perspective

## 📡 API Endpoints

### GET `/api/messages`
Retrieve all messages or filter by category

**Query Parameters:**
- `category` (optional) - Filter messages by category (inspiration, knowledge, thoughts, confessions)

**Response:**
```json
[
  {
    "id": 1,
    "text": "Message content here",
    "category": "inspiration",
    "timestamp": "2025-11-15T10:30:00.000Z"
  }
]
```

### POST `/api/messages`
Create a new anonymous message

**Request Body:**
```json
{
  "message": "Your message here",
  "category": "thoughts"
}
```

**Response:** `201 Created`

## 🎨 Design Features

### Color Scheme
- **Light Mode**: White backgrounds with subtle grays
- **Dark Mode**: Deep blacks with blue accents
- **Accent Color**: #0A84FF (Apple blue)
- **Category Colors**:
  - Inspiration: #FF6B6B (Red)
  - Knowledge: #4ECDC4 (Teal)
  - Thoughts: #95E1D3 (Mint)
  - Confessions: #F38181 (Pink)

### Typography
- **Font**: System font stack (SF Pro, Segoe UI, Roboto)
- **Weights**: 300-600 for hierarchy

### Animations
- `fadeInUp` - Card entrance animation
- `hang` - Continuous swaying effect
- `confetti-fall` - Celebration particles
- `blink` - Cursor effect
- `shake` - Error feedback

## 🔧 Configuration

### Port Configuration
Default port: `3000`

To change the port, modify `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Message Limit
Default character limit: `500`

To change, update `index.html`:
```html
<textarea maxlength="500"></textarea>
```

## 📱 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ⚠️ IE11 (limited support, no backdrop-filter)

## 🤝 Contributing

This is a personal project by Atharv & Ankit. Feel free to fork and customize!

## 📝 License

This project is open source and available under the MIT License.

## 👥 Authors

Made with racism by **Atharv & Ankit**

## 🐛 Known Limitations

- Messages are stored in-memory (lost on server restart)
- No database persistence
- No user authentication
- No message editing/deletion
- No rate limiting

## 🔮 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User accounts & authentication
- [ ] Message reactions & likes
- [ ] Comment threads
- [ ] Admin moderation panel
- [ ] Export messages
- [ ] Image attachments
- [ ] Search functionality
- [ ] WebSocket for real-time updates

---

**Built with Node.js & Express | Designed for anonymous expression**
