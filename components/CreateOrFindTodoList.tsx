'use client'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import TodoList from "@/components/TodoList";
import { createTodoList, findTodoList } from "@/app/actions";
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

const createOrFindTodoListFormSchema = z.object({
  todoListName: z.string().min(3).max(50),
  password: z.string().min(3).max(50),
});

export default function CreateOrFindTodoList() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [listId, setListId] = useState<string>();

  const form = useForm<z.infer<typeof createOrFindTodoListFormSchema>>({
    resolver: zodResolver(createOrFindTodoListFormSchema),
    defaultValues: {
      todoListName: "",
      password: "",
    }
  });

  async function onCreate(values: z.infer<typeof createOrFindTodoListFormSchema>) {
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

  const handleTodoListNotFound = (msg: string) => {
    toast({
      title: msg,
      variant: "destructive"
    })
    setLoading(false)
    form.reset()
  }

  async function onFind(values: z.infer<typeof createOrFindTodoListFormSchema>) {
    setLoading(true)

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
      setListId(listId as string)
      setLoading(false)
      form.reset()
    } catch (error) {
      handleTodoListNotFound((error as Error).message);
      return;
    }
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
          <div className="flex flex-col gap-3">
            <Button disabled={loading} onClick={form.handleSubmit(onFind)}>Find</Button>
            <Button variant='secondary' disabled={loading} type="submit" onClick={form.handleSubmit(onCreate)}>Create</Button>
          </div>
        </form>
      </Form>

      <Separator className='my-4' />

      {listId && (
        <TodoList listId={listId} />
      )}
    </div>
  );
}