# Stock Portfolio Split (SPS)

📊 A simple, offline stock portfolio tracker with visual allocation analysis.

## Features

- ✨ **Simple Entry Form** - Add ticker symbol and amount
- 📊 **Visual Analytics** - See portfolio split with interactive pie chart
- 📈 **Detailed Table View** - Holdings with percentage allocation and totals
- ✏️ **Full CRUD Operations** - Add, edit, delete individual holdings
- 📥 **Bulk Import** - Import portfolio data from JSON
- 📤 **Bulk Export** - Export portfolio to JSON file
- 🌙 **Dark Theme** - Modern dark UI with colorful accents
- 📱 **Fully Responsive** - Works on all device sizes
- 💾 **Local Storage** - Data persists automatically
- 🔒 **Privacy First** - No tracking, works offline

## Usage

### Adding Holdings
1. Enter ticker symbol (e.g., AAPL, MSFT, TCS)
2. Enter amount in rupees
3. Click "Add Holding"

### Managing Holdings
- **Edit**: Click the edit button (✏️) on any row
- **Delete**: Click the delete button (🗑️) on any row
- **View**: See real-time allocation percentages and pie chart

### Bulk Operations

#### Export
1. Click "Export" button in header
2. Downloads portfolio as JSON file

#### Import
1. Click "Import" button in header
2. Paste JSON data or upload file
3. Confirm to replace current portfolio

**JSON Format:**
```json
[
  {"ticker": "AAPL", "amount": 50000},
  {"ticker": "MSFT", "amount": 30000},
  {"ticker": "TCS", "amount": 25000}
]
```

## Design Philosophy

Follows the same minimalist, functional design as other projects:
- Clean, distraction-free interface
- Dark theme with vibrant accent colors
- Instant feedback and smooth animations
- Mobile-first responsive design
- Offline-capable with local storage

## Tech Stack

- HTML5
- CSS3 (Modern CSS Grid & Flexbox)
- Vanilla JavaScript (ES6+)
- Chart.js for pie chart visualization
- LocalStorage for data persistence

## Live Demo

Visit: `https://www.332321.xyz/w/sps/`

## License

Part of the 332321.xyz project collection.
