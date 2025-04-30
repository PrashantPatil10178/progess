import {
  databases,
  DATABASE_ID,
  TODOS_COLLECTION_ID,
  ID,
  Query,
} from "@/lib/appwrite";

interface Todo {
  $id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  pointsAwarded?: boolean;
  isProcessing?: boolean;
  [key: string]: any; // This allows for any additional properties
}
export const getUserTodos = async (userId: string): Promise<Todo[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      TODOS_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );
    return response.documents.map((doc) => ({
      text: doc.text,
      completed: doc.completed,
      userId: doc.userId,
      createdAt: doc.createdAt,
      pointsAwarded: doc.pointsAwarded,
      isProcessing: doc.isProcessing,
      ...doc, // Include any additional properties
    })) as Todo[];
  } catch (error) {
    console.error("Error fetching todos", error);
    throw new Error("Failed to fetch todos");
  }
};

export const createTodo = async (
  userId: string,
  text: string
): Promise<Todo> => {
  try {
    const todo = await databases.createDocument(
      DATABASE_ID,
      TODOS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        text,
        completed: false,
        pointsAwarded: false,
      }
    );
    return {
      $id: todo.$id,
      text: todo.text,
      completed: todo.completed,
      userId: todo.userId,
      createdAt: todo.$createdAt,
      pointsAwarded: todo.pointsAwarded,
      ...Object.fromEntries(
        Object.entries(todo).filter(([key]) => key !== "$id")
      ), // Include any additional properties except $id
    } as Todo;
  } catch (error) {
    console.error("Error creating todo", error);
    throw new Error("Failed to create todo");
  }
};

interface TodoUpdateData {
  text?: string;
  completed?: boolean;
  pointsAwarded?: boolean;
  [key: string]: any;
}

export const updateTodo = async (
  todoId: string,
  data: TodoUpdateData
): Promise<Todo> => {
  try {
    const updated = await databases.updateDocument(
      DATABASE_ID,
      TODOS_COLLECTION_ID,
      todoId,
      data
    );
    return {
      $id: updated.$id,
      text: updated.text,
      completed: updated.completed,
      userId: updated.userId,
      createdAt: updated.$createdAt,
      pointsAwarded: updated.pointsAwarded,
      isProcessing: updated.isProcessing,
      ...Object.fromEntries(
        Object.entries(updated).filter(([key]) => key !== "$id")
      ),
    } as Todo;
  } catch (error) {
    console.error("Error updating todo", error);
    throw new Error("Failed to update todo");
  }
};

export const deleteTodo = async (todoId: string): Promise<boolean> => {
  try {
    await databases.deleteDocument(DATABASE_ID, TODOS_COLLECTION_ID, todoId);
    return true;
  } catch (error) {
    console.error("Error deleting todo", error);
    throw new Error("Failed to delete todo");
  }
};
