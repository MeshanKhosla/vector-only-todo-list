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

const createOrFindTodoListFormSchema = z.object({
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

const TOP_K = 5;

/** Creates an embedding for the given name and adds to vector DB
 *  @param name - Name of the todo list
 *  @param password - Password for the todo list
 *  @returns - Promise<string> - The node ID of the created todo list
 */
export async function createTodoList(formData: z.infer<typeof createOrFindTodoListFormSchema>) {
  const parsedData = createOrFindTodoListFormSchema.safeParse(formData);
  if (!parsedData.success) {
    throw new Error("Invalid form data");
  }

  const { todoListName, password } = parsedData.data;

  const embeddingResult = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: todoListName,
    encoding_format: "float",
  });

  const embedding = embeddingResult.data.at(0)?.embedding;

  if (!embedding) {
    throw new Error("Failed to create embedding for the name");
  }

  if (await todoListNameExists(todoListName, embedding)) {
    throw new Error("Todo list with that name already exists");
  }

  const nodeId = crypto.randomBytes(8).toString("hex");
  const hashedPassword = await bcrypt.hash(password, 8);
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

/** Attempt to find the todo list associated with the name/password */
export async function findTodoList(formData: z.infer<typeof createOrFindTodoListFormSchema>) {
  const parsedData = createOrFindTodoListFormSchema.safeParse(formData);
  if (!parsedData.success) {
    throw new Error("Invalid form data");
  }

  const { todoListName, password } = parsedData.data;

  const embeddingResult = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: todoListName,
    encoding_format: "float",
  });

  const embedding = embeddingResult.data.at(0)?.embedding;

  if (!embedding) {
    throw new Error("Failed to create embedding for the name");
  }

  const queryResult = await index.query({
    vector: embedding,
    topK: TOP_K,
    includeMetadata: true,
    includeVectors: false,
  });

  // Check if any of the results match the password
  for (const result of queryResult) {
    const metadata = result.metadata as VectorMetadata;
    if (metadata[NAME_KEY] === todoListName) {
      const passwordMatch = await bcrypt.compare(password, metadata[PASSWORD_KEY]);
      if (passwordMatch) {
        return result.id as string;
      }
    }
  }

  return false;
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

  const res = {
    name: allMetadata[NAME_KEY],
    todoList: allMetadata[TODO_LIST_KEY],
  };

  return res;
}

/** Checks if a todo list name already exists
 * If the embedding is not provided, it will be created
 */
export async function todoListNameExists(name: string, embedding?: number[]) {
  if (!name && !embedding) {
    throw new Error("Must pass in either the name or the embedding");
  }

  if (name) {
    const embeddingResult = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: name,
      encoding_format: "float",
    });

    embedding = embeddingResult.data.at(0)?.embedding;
  }

  if (!embedding) {
    throw new Error("Failed to create embedding for the name");
  }

  const queryResult = await index.query({
    vector: embedding,
    topK: TOP_K,
    includeMetadata: true,
    includeVectors: false,
  });

  for (const result of queryResult) {
    const metadata = result.metadata as VectorMetadata;
    if (metadata[NAME_KEY] === name) {
      return true;
    }
  }

  return false;
}

type FullQueryResult = {
  id: string;
  vector: number[];
  metadata: VectorMetadata;
}

/** Adds a todo item to the todo list
 *  @param listId - The ID of the todo list
 *  @param allTodos - The list of all todos (including the new one and the old ones)
 */
export async function updateTodoItems(listId: string, allTodos: Todo[]) {
  const existingVector = await index.fetch([listId], {
    includeMetadata: true,
    includeVectors: true,
  }) as FullQueryResult[];

  if (!existingVector[0].vector) {
    throw new Error("Failed to get vector for the todo list");
  }

  const existingMetadata = existingVector[0].metadata;

  const upsertResponse = await index.upsert({
    id: listId,
    vector: existingVector[0].vector,
    metadata: {
      [NAME_KEY]: existingMetadata[NAME_KEY],
      [TODO_LIST_KEY]: allTodos,
      [PASSWORD_KEY]: existingMetadata[PASSWORD_KEY],
    }
  })

  if (upsertResponse !== 'Success') {
    throw new Error("Failed to add todo to the database");
  }
}
