const express = require('express');
const router = express.Router();
const TodoController = require('../controllers/todoController');

const todoController = new TodoController();

// Route to create a new to-do item
router.post('/todos', todoController.createTodo);

// Route to get all to-do items
router.get('/todos', todoController.getAllTodos);

// Route to update a to-do item
router.put('/todos/:id', todoController.updateTodo);

// Route to delete a to-do item
router.delete('/todos/:id', todoController.deleteTodo);

module.exports = router;