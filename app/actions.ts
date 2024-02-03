'use server'
import { Index } from "@upstash/vector"
import OpenAI from "openai";
import crypto from "crypto";
import { z } from "zod";
import bcrypt from "bcrypt";

const openai = new OpenAI();

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

const NAME_KEY = "name";
const TODO_LIST_KEY = "todoList";
const PASSWORD_KEY = "password";

const createTodoFormSchema = z.object({
  todoListName: z.string().min(3).max(50),
  password: z.string().min(3).max(50),
});

export type Todo = {
  id: string;
  name: string;
  completed: boolean;
}

type VectorMetadata = {
  [NAME_KEY]: string;
  [TODO_LIST_KEY]: Todo[]
  [PASSWORD_KEY]: string;
}

/** Creates an embedding for the given name and adds to vector DB
 *  @param name - Name of the todo list
 *  @param password - Password for the todo list
 *  @returns - Promise<string> - The node ID of the created todo list
 */
export async function createTodoList(formData: z.infer<typeof createTodoFormSchema>) {
  const parsedData = createTodoFormSchema.safeParse(formData);
  if (!parsedData.success) {
    throw new Error("Invalid form data");
  }

  const { todoListName, password } = parsedData.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  const embeddingResult = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: todoListName,
    encoding_format: "float",
  });

  const embedding = embeddingResult.data.at(0)?.embedding;

  if (!embedding) {
    throw new Error("Failed to create embedding for the name");
  }

  const nodeId = crypto.randomBytes(8).toString("hex");
  const upsertResponse = await index.upsert({
    id: nodeId,
    vector: embedding,
    metadata: {
      [NAME_KEY]: todoListName,
      [TODO_LIST_KEY]: [],
      [PASSWORD_KEY]: hashedPassword,
    }
  })

  if (upsertResponse !== 'Success') {
    throw new Error("Failed to add vector to the database");
  }

  return nodeId;
}

/** Gets a todo list given a list ID */
export async function getTodoList(listId: string) {
  const vector = await index.fetch([listId], {
    includeMetadata: true,
    includeVectors: false,
  });

  const metadata = vector[0]?.metadata;
  if (!metadata) {
    throw new Error("Todo list not found");
  }

  const allMetadata = metadata as VectorMetadata;

  return {
    name: allMetadata[NAME_KEY],
    todoList: allMetadata[TODO_LIST_KEY],
  };
}