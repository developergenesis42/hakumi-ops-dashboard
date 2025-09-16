import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Todo {
  id?: string;
  [key: string]: unknown;
}

function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getTodos() {
      try {
        setLoading(true);
        const { data: todos, error } = await supabase.from('todos').select();

        if (error) {
          setError(error.message);
        } else if (todos && todos.length > 0) {
          setTodos(todos);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    getTodos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading todos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Todos</h2>
      {todos.length === 0 ? (
        <div className="text-gray-500">No todos found</div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo, index) => (
            <li key={todo.id || index} className="p-3 bg-gray-100 rounded-lg">
              {typeof todo === 'object' ? JSON.stringify(todo) : todo}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TodosPage;
