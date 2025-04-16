import {
  databases,
  DATABASE_ID,
  TODOS_COLLECTION_ID,
  ID,
  Query,
} from "@/lib/appwrite";

// Get all todos for a user
export const getUserTodos = async (userId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      TODOS_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching todos", error);
    throw error;
  }
};

// Create a new todo
export const createTodo = async (userId: string, text: string) => {
  try {
    const todo = await databases.createDocument(
      DATABASE_ID,
      TODOS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        text,
        completed: false,
      }
    );
    return todo;
  } catch (error) {
    console.error("Error creating todo", error);
    throw error;
  }
};

// Update a todo
// Interface for todo update data
interface TodoUpdateData {
  text?: string;
  completed?: boolean;
  [key: string]: any;
}

export const updateTodo = async (todoId: string, data: TodoUpdateData) => {
  try {
    const updated = await databases.updateDocument(
      DATABASE_ID,
      TODOS_COLLECTION_ID,
      todoId,
      data
    );
    return updated;
  } catch (error) {
    console.error("Error updating todo", error);
    throw error;
  }
};

// Delete a todo
export const deleteTodo = async (todoId: string) => {
  try {
    await databases.deleteDocument(DATABASE_ID, TODOS_COLLECTION_ID, todoId);
    return true;
  } catch (error) {
    console.error("Error deleting todo", error);
    throw error;
  }
};
