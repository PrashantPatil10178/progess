import {
  databases,
  DATABASE_ID,
  USERS_COLLECTION_ID,
  WEEKLY_POINTS_COLLECTION_ID,
  MONTHLY_POINTS_COLLECTION_ID,
  Query,
  ID,
} from "@/lib/appwrite";

export const getLeaderboard = async (limit = 10) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.orderDesc("points"), Query.limit(limit)]
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching leaderboard", error);
    throw error;
  }
};

// Get user rank
export const getUserRank = async (userId: string) => {
  try {
    // First get all users sorted by points
    const allUsers = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.orderDesc("points")]
    );

    // Find the index of the current user
    const userIndex = allUsers.documents.findIndex(
      (user) => user.$id === userId
    );

    // Return rank (1-based index)
    return userIndex !== -1 ? userIndex + 1 : null;
  } catch (error) {
    console.error("Error fetching user rank", error);
    throw error;
  }
};

// Get current week in YYYY-WW format
const getCurrentWeek = () => {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-${weekNumber.toString().padStart(2, "0")}`;
};

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
};

// Get weekly leaderboard
export const getWeeklyLeaderboard = async (limit = 10) => {
  try {
    const currentWeek = getCurrentWeek();

    // Get weekly points for current week
    const weeklyPoints = await databases.listDocuments(
      DATABASE_ID,
      WEEKLY_POINTS_COLLECTION_ID,
      [
        Query.equal("week", currentWeek),
        Query.orderDesc("points"),
        Query.limit(limit),
      ]
    );

    // If no weekly data yet, return empty array
    if (weeklyPoints.documents.length === 0) {
      return [];
    }

    // Get user details for each user in the weekly leaderboard
    const userIds = weeklyPoints.documents.map((doc) => doc.userId);
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("$id", userIds)]
    );

    // Combine weekly points with user data
    return weeklyPoints.documents.map((weeklyDoc) => {
      const user = users.documents.find((u) => u.$id === weeklyDoc.userId);
      return {
        ...user,
        points: weeklyDoc.points, // Use weekly points instead of total points
      };
    });
  } catch (error) {
    console.error("Error fetching weekly leaderboard", error);
    throw error;
  }
};

// Get monthly leaderboard
export const getMonthlyLeaderboard = async (limit = 10) => {
  try {
    const currentMonth = getCurrentMonth();

    // Get monthly points for current month
    const monthlyPoints = await databases.listDocuments(
      DATABASE_ID,
      MONTHLY_POINTS_COLLECTION_ID,
      [
        Query.equal("month", currentMonth),
        Query.orderDesc("points"),
        Query.limit(limit),
      ]
    );

    // If no monthly data yet, return empty array
    if (monthlyPoints.documents.length === 0) {
      return [];
    }

    // Get user details for each user in the monthly leaderboard
    const userIds = monthlyPoints.documents.map((doc) => doc.userId);
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("$id", userIds)]
    );

    // Combine monthly points with user data
    return monthlyPoints.documents.map((monthlyDoc) => {
      const user = users.documents.find((u) => u.$id === monthlyDoc.userId);
      return {
        ...user,
        points: monthlyDoc.points, // Use monthly points instead of total points
      };
    });
  } catch (error) {
    console.error("Error fetching monthly leaderboard", error);
    throw error;
  }
};

// Update weekly and monthly points when a user logs progress
export const updateLeaderboardPoints = async (
  userId: string,
  points: number
) => {
  try {
    const currentWeek = getCurrentWeek();
    const currentMonth = getCurrentMonth();

    // Update weekly points
    const weeklyQuery = await databases.listDocuments(
      DATABASE_ID,
      WEEKLY_POINTS_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("week", currentWeek)]
    );

    if (weeklyQuery.documents.length > 0) {
      // Update existing weekly record
      const weeklyDoc = weeklyQuery.documents[0];
      await databases.updateDocument(
        DATABASE_ID,
        WEEKLY_POINTS_COLLECTION_ID,
        weeklyDoc.$id,
        {
          points: weeklyDoc.points + points,
        }
      );
    } else {
      //
      await databases.createDocument(
        DATABASE_ID,
        WEEKLY_POINTS_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          week: currentWeek,
          points,
        }
      );
    }

    // Update monthly points
    const monthlyQuery = await databases.listDocuments(
      DATABASE_ID,
      MONTHLY_POINTS_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("month", currentMonth)]
    );

    if (monthlyQuery.documents.length > 0) {
      // Update existing monthly record
      const monthlyDoc = monthlyQuery.documents[0];
      await databases.updateDocument(
        DATABASE_ID,
        MONTHLY_POINTS_COLLECTION_ID,
        monthlyDoc.$id,
        {
          points: monthlyDoc.points + points,
        }
      );
    } else {
      // Create new monthly record
      await databases.createDocument(
        DATABASE_ID,
        MONTHLY_POINTS_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          month: currentMonth,
          points,
        }
      );
    }
  } catch (error) {
    console.error("Error updating leaderboard points", error);
    throw error;
  }
};
