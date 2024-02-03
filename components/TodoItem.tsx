import { type Todo } from "@/app/actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useOptimistic } from "react"
import { useToast } from "@/components/ui/use-toast"

type TodoItemProps = {
  todo: Todo
  markTodo: (id: string, completed: boolean) => Promise<void>
  idx: number
}

export default function TodoItem(props: TodoItemProps) {
  const { todo, markTodo, idx } = props;
  const { toast } = useToast()
  const [checked, setOptimisticChecked] = useOptimistic(
    todo.completed,
    (_, newState: boolean) => newState
  )

  const handleCheck = async (val: boolean) => {
    setOptimisticChecked(val)
    try {
      await markTodo(todo.id, !checked)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive"
      })
    }
  }

  const bgColor = idx % 2 === 0 ?
    "bg-neutral-200 bg-opacity-50 hover:bg-opacity-100 transition-colors duration-200 ease-in-out"
    : "bg-neutral-400 bg-opacity-50 hover:bg-opacity-100 transition-colors duration-200 ease-in-out"

  return (
    <div onClick={() => handleCheck(!checked)} className={`flex w-full p-5 rounded-lg justify-between items-center hover:cursor-pointer ${bgColor}`}>
      <Label className="text-xl" htmlFor={`todo-${todo.id}`}>
        {todo.name}
      </Label>
      <Checkbox onCheckedChange={handleCheck} checked={checked} id={`todo-${todo.id}`} />
    </div>
  );
}