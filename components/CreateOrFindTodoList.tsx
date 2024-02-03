'use client'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import CreateTodos from "@/components/CreateTodos";
import { Todo, createTodoList, findTodoList, getTodoList, updateTodoItems } from "@/app/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod";
import { useState, useTransition } from "react";
import { Loader2 as Spinner } from "lucide-react";

const createOrFindTodoListFormSchema = z.object({
  todoListName: z.string().min(3).max(50),
  password: z.string().min(3).max(50),
});

export type TodoListData = {
  name: string
  todoList: Todo[]
}

export default function CreateOrFindTodoList() {
  const { toast } = useToast()
  const [todoListName, setTodoName] = useState<string>()
  const [listId, setListId] = useState<string>()
  const [todoList, setTodoList] = useState<Todo[]>()
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof createOrFindTodoListFormSchema>>({
    resolver: zodResolver(createOrFindTodoListFormSchema),
    defaultValues: {
      todoListName: "",
      password: "",
    }
  });

  const markTodo = async (id: string, completed: boolean) => {
    if (!listId || todoList === undefined) return;

    try {
      const updatedTodoList = todoList.map(todo => {
        if (todo.id === id) {
          return {
            ...todo,
            completed
          }
        }
        return todo;
      })

      await updateTodoItems(listId, updatedTodoList)
      setTodoList(updatedTodoList)
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      })
    }
  }

  const createNewTodo = async (todo: Todo) => {
    if (!listId || todoList === undefined) return;

    try {
      await updateTodoItems(listId, [
        ...todoList,
        todo
      ])

      setTodoList((prev) => {
        if (!prev) return prev;
        return [
          ...prev,
          todo
        ]
      })
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      })
    }
  }

  const getTodoListData = async (listId: string) => {
    try {
      const data = await getTodoList(listId)
      setTodoList(data.todoList);
      setTodoName(data.name);
      setListId(listId);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      })
    }
  }

  const onCreate = async (values: z.infer<typeof createOrFindTodoListFormSchema>) => {
    startTransition(async () => {
      try {
        const listId = await createTodoList(values)
        toast({
          title: "Todo List Created",
          variant: "success"
        })
        await getTodoListData(listId)
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive"
        })
      }

      form.reset()
    });
  }

  const handleTodoListNotFound = (msg: string) => {
    toast({
      title: msg,
      variant: "destructive"
    })
    form.reset()
  }

  async function onFind(values: z.infer<typeof createOrFindTodoListFormSchema>) {
    startTransition(async () => {
      try {
        const listId = await findTodoList(values)
        if (!listId) {
          handleTodoListNotFound("Todo List Not Found");
          return;
        }
        toast({
          title: "Todo List Found",
          variant: "success"
        })
        form.reset()
        await getTodoListData(listId)
      } catch (error) {
        handleTodoListNotFound((error as Error).message);
      }
    })
  }

  return (
    <div>
      <Form {...form}>
        <form className="space-y-3">
          <FormField
            control={form.control}
            name="todoListName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Todo List Name</FormLabel>
                <FormControl>
                  <Input disabled={isPending} placeholder="Monday todos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input disabled={isPending} type="password" {...field} />
                </FormControl>
                <FormDescription className="font-bold">
                  This is used to lock your todo list.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className='w-full sm:w-1/2' disabled={isPending} onClick={form.handleSubmit(onFind)}>Find</Button>
            <Button className='w-full sm:w-1/2' variant='secondary' disabled={isPending} type="submit" onClick={form.handleSubmit(onCreate)}>Create</Button>
          </div>
        </form>
      </Form>

      <Separator className='my-4' />

      {isPending && <Spinner className="h-7 w-7 animate-spin" />}

      {(todoList !== undefined) && listId && todoListName && (
        <CreateTodos name={todoListName} todoList={todoList} createNewTodo={createNewTodo} markTodo={markTodo} />
      )}
    </div>
  );
}