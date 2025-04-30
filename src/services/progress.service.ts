import {
  databases,
  DATABASE_ID,
  PROGRESS_COLLECTION_ID,
  Query,
  ID,
} from "@/lib/appwrite";

export const getTodayProgress = async (userId: string) => {
  try {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    const response = await databases.listDocuments(
      DATABASE_ID,
      PROGRESS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("date", formattedDate),
        Query.limit(1),
      ]
    );

    if (response.documents.length > 0) {
      return response.documents[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching today's progress", error);
    throw error;
  }
};

export const getRecentProgress = async (userId: string, limit = 10) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PROGRESS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.orderDesc("date"),
        Query.limit(limit),
      ]
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching recent progress", error);
    throw error;
  }
};

export const logProgress = async (userId: string, progressData: any) => {
  try {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    console.log(" data:", progressData);
    setTimeout(() => {}, 5000);
    const existingProgress = await databases.listDocuments(
      DATABASE_ID,
      PROGRESS_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("date", formattedDate)]
    );

    if (existingProgress.documents.length > 0) {
      const progressId = existingProgress.documents[0].$id;
      return await databases.updateDocument(
        DATABASE_ID,
        PROGRESS_COLLECTION_ID,
        progressId,
        {
          ...progressData,
          date: formattedDate,
        }
      );
    }

    return await databases.createDocument(
      DATABASE_ID,
      PROGRESS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        date: formattedDate,
        ...progressData,
      }
    );
  } catch (error) {
    console.error("Error logging progress", error);
    throw error;
  }
};

export const getProgressByDate = async (userId: string, date: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PROGRESS_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("date", date), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      return response.documents[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching progress by date", error);
    throw error;
  }
};

// Get progress for a specific week
export const getWeeklyProgress = async (
  userId: string,
  weekStart: string,
  weekEnd: string
) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PROGRESS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.greaterThanEqual("date", weekStart),
        Query.lessThanEqual("date", weekEnd),
        Query.orderAsc("date"),
      ]
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching weekly progress", error);
    throw error;
  }
};

export const getMonthlyProgress = async (userId: string, monthYear: string) => {
  try {
    const startDate = `${monthYear}-01`;
    const endMonth = parseInt(monthYear.split("-")[1], 10);
    const endYear = parseInt(monthYear.split("-")[0], 10);
    const lastDay = new Date(endYear, endMonth, 0).getDate();
    const endDate = `${monthYear}-${lastDay}`;

    const response = await databases.listDocuments(
      DATABASE_ID,
      PROGRESS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.greaterThanEqual("date", startDate),
        Query.lessThanEqual("date", endDate),
        Query.orderAsc("date"),
      ]
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching monthly progress", error);
    throw error;
  }
};
