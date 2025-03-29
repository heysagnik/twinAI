const TodoService = require('../services/todoService');

class TodoController {
    async createTodo(req, res) {
        try {
            const todo = await TodoService.create(req.body);
            res.status(201).json({ success: true, data: todo });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getTodos(req, res) {
        try {
            const todos = await TodoService.getAll();
            res.status(200).json({ success: true, data: todos });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateTodo(req, res) {
        try {
            const todo = await TodoService.update(req.params.id, req.body);
            if (!todo) {
                return res.status(404).json({ success: false, message: 'Todo not found' });
            }
            res.status(200).json({ success: true, data: todo });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteTodo(req, res) {
        try {
            const success = await TodoService.delete(req.params.id);
            if (!success) {
                return res.status(404).json({ success: false, message: 'Todo not found' });
            }
            res.status(204).json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new TodoController();