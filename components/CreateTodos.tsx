'use client'

import { type Todo } from "@/app/actions"
import { useOptimistic, useState } from "react"
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import crypto from "crypto";
import { Input } from "@/components/ui/input";
import TodoItem from "@/components/TodoItem";

type CreateTodosProps = {
  name: string
  todoList: Todo[]
  createNewTodo: (todo: Todo) => Promise<void>
  markTodo: (id: string, completed: boolean) => Promise<void>
}

/** Fetches data for the todo list */
export default function CreateTodos(props: CreateTodosProps) {
  const { name, todoList, createNewTodo, markTodo } = props
  const [todoText, setTodoText] = useState("")
  const { toast } = useToast()
  const [optimisticTodoList, addOptimisticTodoList] = useOptimistic(
    todoList,
    (state, newTodo: Todo) => {
      // Check for duplicate id. I feel like this should be handled by `useOptimistic` but not sure.
      // Without this check, the UI will flicker temporarily when adding a new todo.
      if (state.find(todo => todo.id === newTodo.id)) {
        return state;
      }

      return ([
        ...state,
        newTodo
      ])
    }
  )

  const handleAddTodo = async () => {
    if (todoText.length === 0) {
      toast({
        title: "Error",
        description: "Todo cannot be empty",
        variant: "destructive"
      })
      return;
    }

    const newTodo = {
      id: crypto.randomBytes(4).toString("hex"),
      name: todoText,
      completed: false
    } as Todo

    addOptimisticTodoList(newTodo);
    setTodoText("");
    try {
      await createNewTodo(newTodo);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      })
      return;
    }

    toast({
      title: "Todo Added",
      variant: "success"
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTodo();
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{name}</h1>
      <div className='flex gap-3 flex-col sm:flex-row'>
        <Input onKeyDown={handleKeyDown} value={todoText} onChange={e => setTodoText(e.target.value)} placeholder="Make a vector-only app" className="w-full sm:w-11/12" />
        <Button disabled={todoText.length == 0} onClick={handleAddTodo} className="hover:bg-[#10b981] bg-[#6ee7b7] w-full sm:w-1/12">Add</Button>
      </div>
      <div className='flex flex-col gap-2 mt-3'>
        {optimisticTodoList.map((todo, idx) => (
          <TodoItem key={todo.id} todo={todo} markTodo={markTodo} idx={idx} />
        ))}
      </div>
    </div>
  )
}