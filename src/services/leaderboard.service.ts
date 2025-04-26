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

export const getUserRank = async (userId: string) => {
  try {
    const allUsers = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.orderDesc("points")]
    );

    const userIndex = allUsers.documents.findIndex(
      (user) => user.$id === userId
    );

    return userIndex !== -1 ? userIndex + 1 : null;
  } catch (error) {
    console.error("Error fetching user rank", error);
    throw error;
  }
};

const getCurrentWeek = () => {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-${weekNumber.toString().padStart(2, "0")}`;
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
};

export const getWeeklyLeaderboard = async (limit = 10) => {
  try {
    const currentWeek = getCurrentWeek();

    const weeklyPoints = await databases.listDocuments(
      DATABASE_ID,
      WEEKLY_POINTS_COLLECTION_ID,
      [
        Query.equal("week", currentWeek),
        Query.orderDesc("points"),
        Query.limit(limit),
      ]
    );

    if (weeklyPoints.documents.length === 0) {
      return [];
    }

    const userIds = weeklyPoints.documents.map((doc) => doc.userId);
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("$id", userIds)]
    );

    return weeklyPoints.documents.map((weeklyDoc) => {
      const user = users.documents.find((u) => u.$id === weeklyDoc.userId);
      return {
        ...user,
        points: weeklyDoc.points,
      };
    });
  } catch (error) {
    console.error("Error fetching weekly leaderboard", error);
    throw error;
  }
};

export const getMonthlyLeaderboard = async (limit = 10) => {
  try {
    const currentMonth = getCurrentMonth();

    const monthlyPoints = await databases.listDocuments(
      DATABASE_ID,
      MONTHLY_POINTS_COLLECTION_ID,
      [
        Query.equal("month", currentMonth),
        Query.orderDesc("points"),
        Query.limit(limit),
      ]
    );

    if (monthlyPoints.documents.length === 0) {
      return [];
    }

    const userIds = monthlyPoints.documents.map((doc) => doc.userId);
    const users = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("$id", userIds)]
    );

    return monthlyPoints.documents.map((monthlyDoc) => {
      const user = users.documents.find((u) => u.$id === monthlyDoc.userId);
      return {
        ...user,
        points: monthlyDoc.points,
      };
    });
  } catch (error) {
    console.error("Error fetching monthly leaderboard", error);
    throw error;
  }
};

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

    // Update total points in user document
    const userDoc = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );

    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
      points: (userDoc.points || 0) + points,
    });
  } catch (error) {
    console.error("Error updating leaderboard points", error);
    throw error;
  }
};
