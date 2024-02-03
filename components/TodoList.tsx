'use client'

import { type Todo, getTodoList } from "@/app/actions"
import { useEffect, useState } from "react"
import { Loader2 as Spinner } from "lucide-react";

type TodoListData = {
  name: string
  todoList: Todo[]
}

/** Fetches data for the todo list */
export default function TodoList({ listId }: { listId: string }) {
  const [todoData, setTodoData] = useState<TodoListData>()
  useEffect(() => {
    setTodoData(undefined)

    console.log("Fetching todo list data")
    getTodoList(listId).then(data => {
      setTodoData(data)
    })
  }, [listId])

  if (!todoData) {
    return <Spinner className="h-10 w-10 animate-spin" />
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{todoData.name}</h1>
      <ul>
        {todoData.todoList.map(todo => (
          <li key={todo.id} className="flex items-center space-x-2">
            <input type="checkbox" checked={todo.completed} />
            <span>{todo.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}