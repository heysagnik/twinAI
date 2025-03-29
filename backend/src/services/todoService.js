const TodoService = {
    todos: [],

    createTodo: function(todo) {
        this.todos.push(todo);
        return todo;
    },

    getTodos: function() {
        return this.todos;
    },

    updateTodo: function(index, updatedTodo) {
        if (this.todos[index]) {
            this.todos[index] = updatedTodo;
            return updatedTodo;
        }
        throw new Error('Todo not found');
    },

    deleteTodo: function(index) {
        if (this.todos[index]) {
            return this.todos.splice(index, 1);
        }
        throw new Error('Todo not found');
    }
};

module.exports = TodoService;