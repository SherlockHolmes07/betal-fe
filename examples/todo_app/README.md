# Betal Todo - Modern Task Manager

A feature-rich todo application built with [Betal-FE](https://betalfe.com) framework to showcase its capabilities and best practices.

**🚀 [Live Demo](https://betal-todo.vercel.app/)** - Try it now!

![Betal Todo](https://img.shields.io/badge/Framework-Betal--FE-8C9FF5?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## 🎯 Overview

This is an **example application** demonstrating the power and flexibility of the Betal-FE framework. It implements a modern, fully-featured todo application with a clean architecture and beautiful UI.

## ✨ Features

### Core Functionality
- ✅ **Create, Edit, Delete** todos
- 🔄 **Toggle** completion status
- 🔍 **Search & Filter** (All, Active, Completed)
- 💾 **Auto-save** to localStorage
- 🌓 **Dark mode** support

### Task Management
- 📊 **Priority levels** (Low, Medium, High)
- 🏷️ **Categories** (Personal, Work, Shopping, Health, Other)
- 📅 **Due dates** with overdue detection
- 📝 **Validation** (minimum 3 characters)
- ⚡ **Real-time statistics**

### UI/UX
- 🎨 Beautiful gradient design with custom color (#8C9FF5)
- 📱 Fully responsive layout
- ♿ Accessible interface
- 🎭 Smooth transitions and hover effects
- 🔤 Font Awesome icons
- 🌈 Tailwind CSS styling

## 🚀 Betal-FE Features Demonstrated

This application showcases key Betal-FE framework concepts:

### Component Architecture
- **Modular components** with single responsibility
- **Component composition** (Header, Stats, Footer, TodosSection, etc.)
- **Reusable UI components** (StatCard, TodoItem, CreateTodo)

### State Management
- **Local component state** (`state()` method)
- **Props down, events up** pattern
- **Event bubbling** with `emit()` and `on:` handlers
- **State synchronization** with `onPropsChange()`

### Lifecycle Hooks
- `onMounted()` - Load data on component mount
- `onStateChange()` - Persist data on state changes
- `onPropsChange()` - Sync props to local state

### Slots & Content Projection
- **Slots usage** with `hSlot()` for flexible component composition
- **Content projection** pattern demonstrated in Card component

### Code Organization
- **Constants extraction** (styles, options, UI configs)
- **Utility functions** (render helpers, icons)
- **Clean separation of concerns**

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository** (if standalone):
   ```bash
   git clone https://github.com/yourusername/betal-fe.git
   cd betal-fe/examples/todo_app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## 🏃 Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is occupied).



## 🎨 Customization

### Colors
The primary brand color is defined as `#8C9FF5`. You can customize it in:
- [components/header.js](components/header.js) - Logo and title gradients
- [components/footer.js](components/footer.js) - Brand link color

### Icons
Icons are managed via Font Awesome 6. See [utils/icons.js](utils/icons.js) to add or modify icons.

### Default Todos
Default todos are defined in [constants/ui.js](constants/ui.js) in the `DEFAULT_TODOS` array.

## 💾 Data Persistence

- **Todos**: Stored in `localStorage` under key `betal-todos`
- **Dark Mode**: Stored in `localStorage` under key `darkMode`
- **Auto-save**: Triggers on every state change via `onStateChange()` lifecycle hook

## 🧩 Key Components

### App Component (`app.js`)
The root component managing global state and coordinating child components.

### TodosSection (`components/todos-section.js`)
Manages filtering, search, and contains CreateTodo, TodoList, and EmptyState.

### TodoItem (`components/todo-item.js`)
Individual todo with view/edit modes, demonstrates:
- Local state management
- Props synchronization with `onPropsChange()`
- Event emission for parent communication

### CreateTodo (`components/create-todo.js`)
Form component showcasing:
- Form validation
- Conditional rendering (advanced options)
- Shared render helpers

### Card (`components/card.js`)
Generic card wrapper component demonstrating:
- **Slots pattern** with `hSlot()` for content projection
- Flexible component composition
- Reusable container logic

## 🔧 Technical Details

### Dependencies
- **betal-fe**: Core framework
- **vite**: Development server and build tool
- **Font Awesome 6**: Icon library
- **Tailwind CSS**: Utility-first CSS framework

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features required

## 📚 Learning Resources

To understand the code better:

1. **Betal-FE Documentation**: [https://betalfe.com](https://betalfe.com)
2. **Component Patterns**: See `components/` folder for various patterns
3. **State Management**: Review `app.js` and `components/todo-item.js`
4. **Event System**: Check `components/todos-section.js` for event bubbling

## 🤝 Contributing

This is an example application. For contributing to the Betal-FE framework itself, please see the main repository.

## 📄 License

MIT License - See the main Betal-FE repository for details.

---

**Note**: This is a demonstration application showcasing Betal-FE framework features. It's designed for learning and can be used as a starting point for your own Betal-FE applications.
