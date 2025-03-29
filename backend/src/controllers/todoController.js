const TodoService = require('../services/todoService');

const createTodo = (req, res) => {
    try {
        const todo = TodoService.createTodo(req.body);
        res.status(201).json({ success: true, data: todo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllTodos = (req, res) => {
    try {
        const todos = TodoService.getTodos();
        res.status(200).json({ success: true, data: todos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateTodo = (req, res) => {
    const id = parseInt(req.params.id, 10); // adjust as needed
    try {
        const updatedTodo = TodoService.updateTodo(id, req.body);
        res.status(200).json({ success: true, data: updatedTodo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteTodo = (req, res) => {
    const id = parseInt(req.params.id, 10); // adjust as needed
    try {
        const deleted = TodoService.deleteTodo(id);
        res.status(200).json({ success: true, data: deleted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTodo,
    getAllTodos,
    updateTodo,
    deleteTodo
};