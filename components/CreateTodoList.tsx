'use client'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast"
import TodoList from "@/components/TodoList";
import { createTodoList } from "@/app/actions";
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
import { useState } from "react";

const createTodoFormSchema = z.object({
  todoListName: z.string().min(3).max(50),
  password: z.string().min(3).max(50),
});

export default function CreateTodoList() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [listId, setListId] = useState<string>();

  const form = useForm<z.infer<typeof createTodoFormSchema>>({
    resolver: zodResolver(createTodoFormSchema),
    defaultValues: {
      todoListName: "",
      password: "",
    }
  });

  async function onSubmit(values: z.infer<typeof createTodoFormSchema>) {
    setLoading(true)

    try {
      const listId = await createTodoList(values)
      toast({
        title: "Todo List Created",
        variant: "success"
      })
      setListId(listId)
      setLoading(false)
      form.reset()
    } catch (error) {
      setLoading(false)
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      })
      form.reset()
    }
  }

  return (
    <div className="m-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="todoListName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Todo List Name</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="Monday todos" {...field} />
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
                  <Input disabled={loading} type="password" {...field} />
                </FormControl>
                <FormDescription className="font-bold">
                  This is used to lock your todo list. Please don't use a real password
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={loading} type="submit">Create</Button>
        </form>
      </Form>
      {listId && (
        <TodoList listId={listId} />
      )}
    </div>
  );
}