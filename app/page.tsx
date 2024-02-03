import CreateOrFindTodoList from "@/components/CreateOrFindTodoList";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react"
import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6">
      <p className="text-xl font-bold">Create and view your todo lists</p>
      <p className="text-md">The only database used is Upstash Vector. Read more and view code
        <Link target="_blank" href='https://github.com/MeshanKhosla/todo-list-vector'>
          <Button className="ml-1 p-0" variant='link'>
            here
            <ExternalLink className="ml-1" size={15} />
          </Button>
        </Link>.
      </p>

      <Separator className='my-4' />

      <CreateOrFindTodoList />
    </main >
  );
}
