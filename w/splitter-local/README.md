# Expense Splitter 💰

A modern, responsive web application for splitting expenses fairly among group members during trips or shared activities. Built with Vanilla JavaScript and powered by localStorage for offline storage.

## ✨ Features

### Core Functionality
- **Trip Management**: Create and manage trips/groups
- **Member Management**: Add/edit group members
- **Expense Tracking**: Record expenses with detailed split options
- **Real-time Calculations**: Live settlement calculations and suggestions
- **Smart Settlements**: Minimize transactions with optimized payment suggestions

### Enhanced Analytics
- **Dual Chart Views**: Toggle between "Expenses Paid" and "Expenses Incurred" per person
- **Consolidated Settlement Overview**: Single unified view showing both balances and settlement suggestions
- **Real-time Balance Tracking**: Live updates of who owes what to whom

### Split Options
- **Payment Modes**: Single payer or multiple payers
- **Split Types**: 
  - Equal split among all members
  - Percentage-based splits
  - Custom amount splits
  - Share-based splits

### Data Management
- **Offline First**: Works completely offline with localStorage
- **Import/Export**: JSON backup and restore functionality
- **Data Persistence**: Automatic local data caching

### User Experience
- **Responsive Design**: Optimized for mobile to desktop
- **Dark Theme**: Modern dark theme interface
- **Intuitive Interface**: Step-by-step expense entry
- **Real-time Updates**: Live balance calculations
- **Visual Charts**: Dual-view expense analysis with Chart.js

## 🚀 Technology Stack

### Frontend Framework
- **Vanilla JavaScript**: Pure JavaScript with ES6+ features
- **Chart.js**: Data visualization for expense analysis

### Data & Storage
- **localStorage**: Client-side data storage
- **JSON Import/Export**: Portable data format

### Build & Deployment
- **Static Site**: No server required
- **CDN Dependencies**: Minimal setup, fast loading

## 📱 Responsive Design

### Mobile First
- Touch-friendly interface
- Optimized for small screens
- Swipe gestures support
- Mobile-specific navigation

### Desktop Enhanced
- Multi-column layouts
- Keyboard shortcuts
- Hover interactions
- Advanced data visualization

## 🎯 Use Cases

### Travel Groups
- Split accommodation costs
- Shared meal expenses
- Transportation costs
- Activity fees

### Roommates
- Utility bills
- Grocery shopping
- Shared household items
- Rent and deposits

### Social Events
- Party expenses
- Group gifts
- Event planning costs
- Venue and catering

## 🔧 Installation & Setup

### Quick Start
1. Clone or download the project
2. Open `index.html` in a modern web browser
3. Start creating trips and adding expenses!

### Local Development
```bash
# No build process required - it's a static site!
# Just serve the files with any static server

# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

### Deployment
- Deploy to any static hosting service
- GitHub Pages, Netlify, Vercel ready
- No server-side dependencies

## 📊 Calculation Logic

### Balance Calculation
```
Member Balance = Total Paid - Total Owed
- Positive balance: Member gets money back
- Negative balance: Member owes money
- Zero balance: Member is settled
```

### Settlement Optimization
The app uses a greedy algorithm to minimize the number of transactions needed to settle all balances:

1. Sort members by balance amount
2. Match highest creditor with highest debtor
3. Create settlement for minimum of both amounts
4. Repeat until all balances are settled

### Split Validation
- Ensures total split amounts equal expense amount
- Validates percentage splits sum to 100%
- Prevents division by zero in share-based splits
- Handles floating-point precision issues

## 🎨 Design System

### Color Scheme
```css
Primary: #1976d2 (Blue)
Secondary: #26a69a (Teal)
Accent: #9c27b0 (Purple)
Positive: #21ba45 (Green)
Negative: #c10015 (Red)
Warning: #f2c037 (Yellow)
```

### Typography
- **Headers**: Roboto 500/700
- **Body**: Roboto 400
- **Currency**: Courier New (monospace)

### Icons
- Material Design Icons
- Consistent sizing and spacing
- Semantic color coding

## 🔒 Privacy & Security

### Data Privacy
- **100% Client-side**: No data sent to external servers
- **Local Storage Only**: All data stays on your device
- **No Analytics**: No tracking or data collection
- **Export Control**: You own and control your data

### Security Features
- Input validation and sanitization
- XSS protection through Vue.js
- No external API dependencies
- Offline-first architecture

## 🤝 Contributing

### Development Guidelines
1. Follow Vue.js 3 best practices
2. Use Quasar components when possible
3. Maintain responsive design principles
4. Add proper error handling
5. Include JSDoc comments for functions

### Code Structure
```
/js/
  ├── app.js          # Main Vue application
  ├── components.js   # Vue components
  ├── database.js     # IndexedDB operations
  └── calculations.js # Expense calculations
```

### Testing
- Manual testing across devices
- Browser compatibility testing
- Offline functionality testing
- Data integrity validation

## 🐛 Known Issues & Limitations

### Current Limitations
- No real-time collaboration (by design)
- No receipt image storage
- Single currency per trip
- No recurring expense templates

### Future Enhancements
- Receipt photo attachment
- Multiple currency support
- Expense templates and categories
- Advanced reporting and analytics
- PWA with offline sync

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

### Inspiration
- **Splitwise**: UX/UI inspiration
- **IHateMoney**: Simple expense splitting concept
- **Tricount**: Group expense management

### Libraries & Frameworks
- Vue.js team for the excellent framework
- Quasar team for the UI components
- Dexie.js for IndexedDB abstraction
- Chart.js for data visualization

## 📞 Support

### Documentation
- Check this README for basic usage
- Review code comments for implementation details
- Test with sample data before real usage

### Community
- Open issues for bugs or feature requests
- Contribute improvements via pull requests
- Share feedback and use cases

---

**Built with ❤️ for fair expense splitting**
